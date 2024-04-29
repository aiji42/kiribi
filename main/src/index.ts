import { WorkerEntrypoint } from 'cloudflare:workers';
import { PrismaD1 } from '@prisma/adapter-d1';
import { type Job, type Prisma, PrismaClient } from '@prisma/client';
import { Hono } from 'hono';
import { InferPayload, type KiribiPerformer } from './performer';
import { type Rest } from './rest';
import { type Client } from './client';

function assert(condition: any): asserts condition {
	if (!condition) throw new Error('Assertion failed');
}

const jobStatus = {
	pending: 'PENDING',
	processing: 'PROCESSING',
	retryPending: 'RETRY_PENDING',
	completed: 'COMPLETED',
	failed: 'FAILED',
	cancelled: 'CANCELLED',
};

type Status = (typeof jobStatus)[keyof typeof jobStatus];

type Performers = {
	[binding: string]: KiribiPerformer;
};

type Bindings = { KIRIBI_DB: D1Database; KIRIBI_QUEUE: Queue };

type Result = { status: 'success' | 'failed'; error: string | null; startedAt: number; finishedAt: number; processingTime: number };

export type EnqueueOptions = {
	maxRetries?: number;
	retryDelay?: number | { exponential: boolean; base: number };
	firstDelay?: number;
};

type EnqueueArgs<M extends Performers> = {
	[K in keyof M]: [K, InferPayload<M[K]>, EnqueueOptions?];
}[keyof M];

export type SuccessHandlerMeta = { startedAt: Date; finishedAt: Date; attempts: number };

export type FailureHandlerMeta = { startedAt: Date; finishedAt: Date; isFinal: boolean; attempts: number };

export class Kiribi<T extends Performers = any, B extends Bindings = Bindings> extends WorkerEntrypoint<B> {
	private prisma: PrismaClient<{ adapter: PrismaD1 }>;
	public client: Client | null = null;
	public rest: Rest | null = null;

	constructor(ctx: ExecutionContext, env: B) {
		super(ctx, env);
		const adapter = new PrismaD1(env.KIRIBI_DB);
		this.prisma = new PrismaClient({ adapter });
	}

	async enqueue(...[binding, payload, params]: EnqueueArgs<T>) {
		assert(typeof binding === 'string');
		const res = await this.prisma.job.create({
			data: { binding, payload: JSON.stringify(payload), params: JSON.stringify(params) },
		});
		return this.env.KIRIBI_QUEUE.send(res, { delaySeconds: params?.firstDelay });
	}

	async recover(id?: string) {
		if (id) {
			const res = await this.prisma.job.findUniqueOrThrow({ where: { id } });
			if (!maybeDead(res)) throw new Error('Job is not dead');

			return this.env.KIRIBI_QUEUE.send(res);
		}

		const deadJobs = await this.findDeadJobs();
		return Promise.allSettled(deadJobs.map((job) => this.env.KIRIBI_QUEUE.send(job)));
	}

	async findDeadJobs() {
		const jobs = await this.prisma.job.findMany({
			where: { status: { in: [jobStatus.pending, jobStatus.retryPending] }, createdAt: { lt: new Date(Date.now() - 60000) } },
		});
		return jobs.filter(maybeDead);
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

	// default: 7 days ago with statuses completed and cancelled
	async sweep({
		olderThan = 7 * 24 * 60 * 60 * 1000,
		statuses = [jobStatus.completed, jobStatus.cancelled],
	}: { olderThan?: Date | number; statuses?: Status[] | '*' } = {}) {
		return this.prisma.job.deleteMany({
			where: {
				createdAt: { lt: typeof olderThan === 'number' ? new Date(Date.now() - olderThan) : olderThan },
				status: statuses === '*' ? undefined : { in: statuses },
			},
		});
	}

	async fetch(res: Request) {
		const app = new Hono();
		if (this.client) app.route('/', this.client);
		if (this.rest) app.route('/', this.rest);

		return app.fetch(res, this.env, this.ctx);
	}

	async queue(batch: MessageBatch<Job>) {
		await Promise.allSettled(
			batch.messages.map(async (msg) => {
				const params: EnqueueOptions = JSON.parse(msg.body.params || '{}');

				const target = await this.prisma.job.findUnique({ where: { id: msg.body.id } });
				if (!target) {
					console.warn('Job not found', msg.body.id);
					msg.ack();
					return;
				}
				if (![jobStatus.pending, jobStatus.retryPending].includes(target.status)) {
					console.warn('Job is not pending or retry pending', msg.body.id);
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
				const bindingName = msg.body.binding;
				const payload = JSON.parse(msg.body.payload);

				const data: Prisma.JobUpdateInput = {};

				try {
					// @ts-ignore
					const service = this.env[bindingName];
					if (!service) throw new Error(`Service Binding not found: ${bindingName}`);
					const result = await service.perform(payload);

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

					await this.onSuccess?.(bindingName, payload, result, {
						startedAt,
						finishedAt: completedAt,
						attempts,
					})?.catch((err) => console.error(err));
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

					await this.onFailure?.(bindingName, payload, err, {
						startedAt,
						finishedAt,
						isFinal: !retryable,
						attempts,
					})?.catch(console.error);
				} finally {
					await this.prisma.job.update({
						where: { id: msg.body.id },
						data,
					});

					if (data.status === jobStatus.retryPending) {
						// MEMO: do not work delaySeconds on dev environment
						msg.retry({ delaySeconds: calcRetryDelay(params.retryDelay, attempts) });
					} else {
						msg.ack();
					}
				}
			}),
		);

		batch.ackAll();
	}

	onSuccess?(binding: string, payload: any, result: any, meta: SuccessHandlerMeta): Promise<void> | void;

	onFailure?(binding: string, payload: any, error: any, meta: FailureHandlerMeta): Promise<void> | void;
}

const calcRetryDelay = (retryDelay: EnqueueOptions['retryDelay'], attempts: number) => {
	return typeof retryDelay === 'object' && retryDelay.exponential
		? Math.pow(Math.max(retryDelay.base, 2), attempts)
		: typeof retryDelay === 'object'
			? retryDelay.base
			: retryDelay;
};

const maybeDead = (job: Job) => {
	const thresholdSec = 60;

	if (![jobStatus.pending, jobStatus.retryPending].includes(job.status)) return false;
	const { firstDelay = 0, retryDelay }: EnqueueOptions = JSON.parse(job.params || '{}');
	if (job.status === jobStatus.pending) {
		return Date.now() - job.createdAt.getTime() > (firstDelay + thresholdSec) * 1000;
	}
	if (job.status === jobStatus.retryPending) {
		const results: Result[] = JSON.parse(job.result || '[]');
		const delay = calcRetryDelay(retryDelay, job.attempts) ?? 0;
		const lastFinishedAt = results[results.length - 1]?.finishedAt;
		// unexpected case: lastFinishedAt is undefined (the job is retryPending but no result)
		if (!lastFinishedAt) return false;

		return Date.now() - lastFinishedAt > (delay + thresholdSec) * 1000;
	}

	return false;
};
