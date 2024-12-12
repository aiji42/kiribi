import { WorkerEntrypoint } from 'cloudflare:workers';
import { Hono } from 'hono';
import { InferPayload, type KiribiPerformer } from './performer';
import { DB, EnqueueOptions, jobStatus, Job, Status } from './db';
import { and, inArray, lt } from 'drizzle-orm';
import { ListQuery } from './schema';
import type { client } from './client';
import type { rest } from './rest';

function assert(condition: any): asserts condition {
	if (!condition) throw new Error('Assertion failed');
}

type Performers = {
	[binding: string]: KiribiPerformer;
};

type Bindings = { KIRIBI_DB: D1Database; KIRIBI_QUEUE: Queue };

type EnqueueArgs<M extends Performers> = {
	[K in keyof M]: [K, InferPayload<M[K]>, EnqueueOptions?];
}[keyof M];

export type SuccessHandlerMeta = { startedAt: Date; finishedAt: Date; attempts: number };

export type FailureHandlerMeta = { startedAt: Date; finishedAt: Date; isFinal: boolean; attempts: number };

export class KiribiTimeoutError extends Error {
	constructor(public readonly job: Job) {
		super(`Job (${job.binding}) timed out`);
		this.name = 'KiribiTimeoutError';
	}
}

export class Kiribi<T extends Performers = any, B extends Bindings = Bindings> extends WorkerEntrypoint<B> {
	private db: DB;
	public client: typeof client | null = null;
	public rest: typeof rest | null = null;
	public defaultMaxRetries: number = 3;
	public defaultTimeout: number = 0;

	constructor(ctx: ExecutionContext, env: B) {
		super(ctx, env);
		this.db = new DB(env);
	}

	async enqueue(...[binding, payload, params]: EnqueueArgs<T>) {
		assert(typeof binding === 'string');
		const res = await this.db.jobEnqueue(binding, payload, params);
		return this.env.KIRIBI_QUEUE.send(res, { delaySeconds: params?.firstDelay });
	}

	async recover(id?: string) {
		if (id) {
			const res = await this.db.jobFindOneOrThrow(id);
			if (!maybeDead(res)) throw new Error('Job is not dead');

			return this.env.KIRIBI_QUEUE.send(res);
		}

		const deadJobs = await this.findDeadJobs();
		return Promise.allSettled(deadJobs.map((job) => this.env.KIRIBI_QUEUE.send(job)));
	}

	async findDeadJobs() {
		const jobs = await this.db.jobFindMany({
			where: (r, { lt, and, inArray }) =>
				and(inArray(r.status, [jobStatus.pending, jobStatus.retryPending]), lt(r.createdAt, new Date(Date.now() - 60000))),
		});
		return jobs.filter(maybeDead);
	}

	async delete(id: string) {
		await this.db.jobDeleteOne(id);
	}

	async deleteMany(ids: string[]) {
		await this.db.jobDeleteMany(inArray(Job.id, ids));
	}

	async cancel(id: string) {
		const target = await this.db.jobFindOneOrThrow(id);
		if (![jobStatus.retryPending, jobStatus.pending].includes(target.status))
			throw new Error('Cannot cancel a job that is not pending or retry pending');

		await this.db.jobUpdateOne(id, { status: jobStatus.cancelled });
	}

	async find(id: string) {
		return this.db.jobFindOneOrThrow(id);
	}

	async findMany({ filter, sort, page }: ListQuery) {
		return this.db.jobFindMany({
			columns: {
				id: true,
				binding: true,
				status: true,
				attempts: true,
				createdAt: true,
				updatedAt: true,
				startedAt: true,
				finishedAt: true,
				completedAt: true,
				processingTime: true,
			},
			where: (r, { eq, inArray, and }) =>
				and(
					filter?.binding ? inArray(r.binding, Array.isArray(filter.binding) ? filter.binding : [filter.binding]) : undefined,
					filter?.status ? inArray(r.status, Array.isArray(filter.status) ? filter.status : [filter.status]) : undefined,
				),
			orderBy: (r, { asc, desc }) => [sort ? (sort.desc ? desc(r[sort.key]) : asc(r[sort.key])) : desc(r.id), desc(r.id)],
			offset: page ? page.index * page.size : undefined,
			limit: page ? page.size : 100,
		});
	}

	async count(filter: ListQuery['filter']) {
		return this.db.jobCount(
			and(
				filter?.binding ? inArray(Job.binding, Array.isArray(filter.binding) ? filter.binding : [filter.binding]) : undefined,
				filter?.status ? inArray(Job.status, Array.isArray(filter.status) ? filter.status : [filter.status]) : undefined,
			),
		);
	}

	// default: 7 days ago with statuses completed and cancelled
	async sweep({
		olderThan = 7 * 24 * 60 * 60 * 1000,
		statuses = [jobStatus.completed, jobStatus.cancelled],
	}: { olderThan?: Date | number; statuses?: Status[] | '*' } = {}) {
		const createdAt = typeof olderThan === 'number' ? new Date(Date.now() - olderThan) : olderThan;
		const query = statuses === '*' ? lt(Job.createdAt, createdAt) : and(lt(Job.createdAt, createdAt), inArray(Job.status, statuses));
		return this.db.jobDeleteMany(query);
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
				const params: EnqueueOptions = msg.body.params ?? {};

				const target = await this.db.jobFindOne(msg.body.id);
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
				const job = await this.db.jobUpdateOne(msg.body.id, {
					status: jobStatus.processing,
					startedAt,
					attempts: target.attempts + 1,
				});
				const results = job.result ?? [];
				const attempts = job.attempts;
				const bindingName = msg.body.binding;
				const payload = msg.body.payload;

				const data: Partial<Job> = {};

				try {
					// @ts-ignore
					const service = this.env[bindingName];
					if (!service) throw new Error(`Service Binding not found: ${bindingName}`);

					const timeout = params.timeout ?? this.defaultTimeout;
					let result: any;
					if (timeout > 0) {
						result = await Promise.race([
							service.perform(payload),
							new Promise((_, reject) => setTimeout(() => reject(new KiribiTimeoutError(job)), timeout * 1000)),
						]);
					} else {
						result = await service.perform(payload);
					}

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
					data.result = results;

					await this.onSuccess?.(bindingName, payload, result, {
						startedAt,
						finishedAt: completedAt,
						attempts,
					})?.catch((err) => console.error(err));
				} catch (err) {
					const retryable = attempts < (params.maxRetries ?? this.defaultMaxRetries);
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
					data.result = results;

					await this.onFailure?.(bindingName, payload, err, {
						startedAt,
						finishedAt,
						isFinal: !retryable,
						attempts,
					})?.catch(console.error);
				} finally {
					await this.db.jobUpdateOne(msg.body.id, data);

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
	const { firstDelay = 0, retryDelay }: EnqueueOptions = job.params ?? {};
	if (job.status === jobStatus.pending) {
		return Date.now() - job.createdAt.getTime() > (firstDelay + thresholdSec) * 1000;
	}
	if (job.status === jobStatus.retryPending) {
		const results = job.result ?? [];
		const delay = calcRetryDelay(retryDelay, job.attempts) ?? 0;
		const lastFinishedAt = results[results.length - 1]?.finishedAt;
		// unexpected case: lastFinishedAt is undefined (the job is retryPending but no result)
		if (!lastFinishedAt) return false;

		return Date.now() - lastFinishedAt > (delay + thresholdSec) * 1000;
	}

	return false;
};
