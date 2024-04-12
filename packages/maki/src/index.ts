import { WorkerEntrypoint } from 'cloudflare:workers';
import { PrismaD1 } from '@prisma/adapter-d1';
import { Job, PrismaClient, Prisma } from '@prisma/client';

const jobStatus = {
	pending: 'PENDING',
	processing: 'PROCESSING',
	retryPending: 'RETRY_PENDING',
	completed: 'COMPLETED',
	failed: 'FAILED',
	cancelled: 'CANCELLED',
};

type Bindings = { MAKI_DB: D1Database; MAKI_QUEUE: Queue; MAKI: Service<Maki> };

type Result = { status: 'success' | 'failed'; error: string | null; startedAt: number; finishedAt: number; processingTime: number };

type Params = {
	maxRetries?: number;
	retryDelay?: number | { exponential: boolean; base: number };
	firstDelay?: number;
};

class Maki extends WorkerEntrypoint<Bindings> {
	private prisma: PrismaClient<{ adapter: PrismaD1 }>;

	constructor(ctx: ExecutionContext, env: Bindings) {
		super(ctx, env);
		const adapter = new PrismaD1(env.MAKI_DB);
		this.prisma = new PrismaClient({ adapter });
	}

	async enqueue<T extends unknown>(binding: string, payload: T, params?: Params) {
		console.log('Enqueuing a job', binding, payload, params);
		const res = await this.prisma.job.create({
			data: { binding, payload: JSON.stringify(payload), params: JSON.stringify(params) },
		});
		return this.env.MAKI_QUEUE.send(res, { delaySeconds: params?.firstDelay });
	}

	// Delete all jobs that are older than 7 days and have a status of completed or failed
	async sweep() {
		return this.prisma.job.deleteMany({
			where: {
				createdAt: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
				status: { in: [jobStatus.completed, jobStatus.failed] },
			},
		});
	}

	async fetch(_: Request) {
		return new Response('This is Maki');
	}

	async queue(batch: MessageBatch<Job>) {
		await Promise.allSettled(
			batch.messages.map(async (msg) => {
				const params: Params = JSON.parse(msg.body.params || '{}');

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
					// @ts-ignore
					const service = this.env[msg.body.binding] as Service<any>;
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

export default Maki;

export abstract class MakiJobWorker<P extends unknown = any> extends WorkerEntrypoint {
	fetch() {
		return new Response('This is Maki Job Worker');
	}
	isJobWorker() {
		return true;
	}

	abstract perform(payload: P): void | Promise<void>;
}
