import { WorkerEntrypoint } from 'cloudflare:workers';
import { PrismaD1 } from '@prisma/adapter-d1';
import { Job, PrismaClient, Prisma } from './.prisma';

export const jobStatus = {
	pending: 'PENDING',
	processing: 'PROCESSING',
	retryPending: 'RETRY_PENDING',
	completed: 'COMPLETED',
	failed: 'FAILED',
	cancelled: 'CANCELLED',
};

type Bindings = { KIRIBI_DB: D1Database; KIRIBI_QUEUE: Queue } & { [x: string]: Service<KiribiJobWorker> };

type Result = { status: 'success' | 'failed'; error: string | null; startedAt: number; finishedAt: number; processingTime: number };

type Params = {
	maxRetries?: number;
	retryDelay?: number | { exponential: boolean; base: number };
	firstDelay?: number;
};

class Kiribi extends WorkerEntrypoint<Bindings> {
	private prisma: PrismaClient<{ adapter: PrismaD1 }>;

	constructor(ctx: ExecutionContext, env: Bindings) {
		super(ctx, env);
		const adapter = new PrismaD1(env.KIRIBI_DB);
		this.prisma = new PrismaClient({ adapter });
	}

	async enqueue<T extends unknown>(binding: string, payload: T, params?: Params) {
		console.log('Enqueuing a job', binding, payload, params);
		const res = await this.prisma.job.create({
			data: { binding, payload: JSON.stringify(payload), params: JSON.stringify(params) },
		});
		return this.env.KIRIBI_QUEUE.send(res, { delaySeconds: params?.firstDelay });
	}

	async delete(id: string) {
		await this.prisma.job.delete({ where: { id } });
	}

	async cancel(id: string) {
		const target = await this.prisma.job.findUniqueOrThrow({ where: { id } });
		if (![jobStatus.retryPending, jobStatus.pending].includes(target.status))
			throw new Error('Cannot cancel a job that is not pending or retry pending');

		await this.prisma.job.update({ where: { id }, data: { status: jobStatus.cancelled } });
	}

	async find(id: string) {
		return this.prisma.job.findUniqueOrThrow({ where: { id } });
	}

	async findMany(...query: Parameters<typeof this.prisma.job.findMany>) {
		return this.prisma.job.findMany(...query);
	}

	async count(...query: Parameters<typeof this.prisma.job.count>) {
		return this.prisma.job.count(...query);
	}

	async sweep() {
		return this.prisma.job.deleteMany({
			where: {
				createdAt: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
				status: { in: [jobStatus.completed, jobStatus.failed] },
			},
		});
	}

	async fetch(_: Request) {
		return new Response('This is Kiribi');
	}

	async queue(batch: MessageBatch<Job>) {
		await Promise.allSettled(
			batch.messages.map(async (msg) => {
				const params: Params = JSON.parse(msg.body.params || '{}');

				const target = await this.prisma.job.findUnique({ where: { id: msg.body.id } });
				if (!target) {
					console.log('Job not found', msg.body.id);
					msg.ack();
					return;
				}
				if (![jobStatus.pending, jobStatus.retryPending].includes(target.status)) {
					console.log('Job is not pending or retry pending', msg.body.id);
					msg.ack();
					return;
				}

				const startedAt = new Date();
				const job = await this.prisma.job.update({
					where: { id: msg.body.id },
					data: {
						status: jobStatus.processing,
						startedAt,
						attempts: { increment: 1 },
					},
				});
				const results: Result[] = JSON.parse(job.result || '[]');
				const attempts = job.attempts;

				const data: Prisma.JobUpdateInput = {};

				try {
					console.log('Processing job', msg.body.id);
					const service = this.env[msg.body.binding];
					if (!service) throw new Error(`Service not found: ${msg.body.binding}`);
					await service.perform(JSON.parse(msg.body.payload));

					const completedAt = new Date();
					data.status = jobStatus.completed;
					data.finishedAt = completedAt;
					data.completedAt = completedAt;
					data.processingTime = completedAt.getTime() - startedAt.getTime();
					results.push({
						status: 'success',
						error: null,
						startedAt: startedAt.getTime(),
						finishedAt: completedAt.getTime(),
						processingTime: data.processingTime,
					});
					data.result = JSON.stringify(results);

					console.log('Completed job', msg.body.id);
				} catch (err) {
					const retryable = attempts < (params.maxRetries ?? 3);
					const finishedAt = new Date();
					data.status = retryable ? jobStatus.retryPending : jobStatus.failed;
					data.finishedAt = finishedAt;
					results.push({
						status: 'failed',
						error: String(err),
						startedAt: startedAt.getTime(),
						finishedAt: finishedAt.getTime(),
						processingTime: finishedAt.getTime() - startedAt.getTime(),
					});
					data.result = JSON.stringify(results);

					console.log('Failed job', msg.body.id);
				} finally {
					await this.prisma.job.update({
						where: { id: msg.body.id },
						data,
					});

					if (data.status === jobStatus.retryPending) {
						const delaySeconds =
							typeof params.retryDelay === 'object' && params.retryDelay.exponential
								? Math.pow(Math.max(params.retryDelay.base, 2), attempts)
								: typeof params.retryDelay === 'object'
									? params.retryDelay.base
									: params.retryDelay;
						// MEMO: do not work delaySeconds on dev environment
						msg.retry({ delaySeconds });
						console.log('Retrying job', msg.body.id);
					} else {
						msg.ack();
					}
				}
			}),
		);

		batch.ackAll();
	}
}

export default Kiribi;

export abstract class KiribiJobWorker<P extends unknown = any> extends WorkerEntrypoint {
	fetch() {
		return new Response('This is Kiribi Job Worker');
	}
	isJobWorker() {
		return true;
	}

	abstract perform(payload: P): void | Promise<void>;
}
