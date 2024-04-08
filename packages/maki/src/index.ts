import { WorkerEntrypoint } from 'cloudflare:workers';
import { PrismaD1 } from '@prisma/adapter-d1';
import { Job, PrismaClient, Prisma } from '@prisma/client';

const jobStatus = {
	pending: 'PENDING',
	processing: 'PROCESSING',
	retryPending: 'RETRY_PENDING',
	completed: 'COMPLETED',
	failed: 'FAILED',
};

type Status = (typeof jobStatus)[keyof typeof jobStatus];

type Bindings = { MAKI_DB: D1Database; MAKI_QUEUE: Queue };

class Maki extends WorkerEntrypoint<Bindings> {
	private prisma: PrismaClient<{ adapter: PrismaD1 }>;

	constructor(ctx: ExecutionContext, env: Bindings) {
		super(ctx, env);
		const adapter = new PrismaD1(env.MAKI_DB);
		this.prisma = new PrismaClient({ adapter });
	}

	async enqueue<T extends unknown>(type: string, payload: T) {
		console.log('Enqueuing a job', type);
		const res = await this.prisma.job.create({
			data: { type, payload: JSON.stringify(payload) },
		});
		return this.env.MAKI_QUEUE.send(res);
	}

	async list(filter?: { type?: string | string[]; status?: Status | Status[] }) {
		return this.prisma.job.findMany({
			where: {
				type: filter?.type ? { in: Array.isArray(filter.type) ? filter.type : [filter.type] } : undefined,
				status: filter?.status ? { in: Array.isArray(filter.status) ? filter.status : [filter.status] } : undefined,
			},
			orderBy: { createdAt: 'desc' },
		});
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

	async fetch() {
		return new Response('This is Maki');
	}

	async queue(batch: MessageBatch<Job>) {
		await Promise.allSettled(
			batch.messages.map(async (msg) => {
				const startedAt = new Date();
				await this.prisma.job.update({
					where: { id: msg.body.id },
					data: {
						status: jobStatus.processing,
						startedAt,
						// FIXME: rename column to attempts
						retriedCount: msg.attempts,
					},
				});

				const data: Prisma.JobUpdateInput = {};

				try {
					console.log('Processing job', msg.body.id);
					// @ts-ignore
					const service = this.env[msg.body.type];
					const result = await service.perform(JSON.parse(msg.body.payload));

					const completedAt = new Date();
					data.status = jobStatus.completed;
					data.finishedAt = completedAt;
					data.completedAt = completedAt;
					data.processingTime = completedAt.getTime() - startedAt.getTime();
					// FIXME: do not overwrite result if it is already set
					data.result = JSON.stringify(result);

					console.log('Completed job', msg.body.id);
					msg.ack();
				} catch (err) {
					// FIXME: detect max_retries
					const retryable = msg.attempts < 3;
					const finishedAt = new Date();
					data.status = retryable ? jobStatus.retryPending : jobStatus.failed;
					data.finishedAt = finishedAt;
					// FIXME: do not overwrite result if it is already set
					data.result = String(err);

					if (retryable) {
						console.log('Retrying job', msg.body.id);
						msg.retry();
					} else {
						console.log('Failed job', msg.body.id);
						msg.ack();
					}
				} finally {
					await this.prisma.job.update({
						where: { id: msg.body.id },
						data,
					});
				}
			}),
		);

		batch.ackAll();
	}
}

export default Maki;
