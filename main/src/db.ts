import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { count, eq, InferSelectModel, SQL } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const jobStatus = {
	pending: 'PENDING',
	processing: 'PROCESSING',
	retryPending: 'RETRY_PENDING',
	completed: 'COMPLETED',
	failed: 'FAILED',
	cancelled: 'CANCELLED',
};

export type Status = (typeof jobStatus)[keyof typeof jobStatus];

export type EnqueueOptions = {
	maxRetries?: number;
	retryDelay?: number | { exponential: boolean; base: number };
	firstDelay?: number;
};

export type Result = { status: 'success' | 'failed'; error: string | null; startedAt: number; finishedAt: number; processingTime: number };

export const Job = sqliteTable(
	'Job',
	{
		id: text('id').primaryKey().notNull(),
		binding: text('binding').notNull(),
		status: text('status').default('PENDING').notNull().$type<Status>(),
		attempts: integer('attempts').default(0).notNull(),
		payload: text('payload', { mode: 'json' }).notNull(),
		params: text('params', { mode: 'json' }).$type<EnqueueOptions>(),
		result: text('result', { mode: 'json' }).$type<Result[]>(),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(new Date()),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
		startedAt: integer('startedAt', { mode: 'timestamp' }),
		finishedAt: integer('finishedAt', { mode: 'timestamp' }),
		completedAt: integer('completedAt', { mode: 'timestamp' }),
		processingTime: integer('processingTime'),
	},
	(table) => {
		return {
			bindingIndex: index('Job_binding_idx').on(table.binding),
			statusIndex: index('Job_status_idx').on(table.status),
			createdAtIndex: index('Job_createdAt_idx').on(table.createdAt),
			startedAtIndex: index('Job_startedAt_idx').on(table.startedAt),
			finishedAtIndex: index('Job_finishedAt_idx').on(table.finishedAt),
			completedAtIndex: index('Job_completedAt_idx').on(table.completedAt),
			attemptsIndex: index('Job_attempts_idx').on(table.attempts),
			processingTimeIndex: index('Job_processingTime_idx').on(table.processingTime),
		};
	},
);

const schema = { Job };

export type Schema = typeof schema;

export class DB {
	private db: DrizzleD1Database<Schema>;
	constructor(env: { KIRIBI_DB: D1Database }) {
		this.db = drizzle(env.KIRIBI_DB, { schema });
	}

	async jobEnqueue(binding: string, payload: unknown, params?: EnqueueOptions) {
		const [res] = await this.db
			.insert(Job)
			.values({
				id: createId(),
				binding,
				payload,
				params,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return res;
	}

	async jobFindOne(id: string) {
		return this.db.query.Job.findFirst({ where: (r, { eq }) => eq(r.id, id) });
	}

	async jobFindOneOrThrow(id: string) {
		const job = await this.jobFindOne(id);
		if (!job) throw new Error(`Job not found (id: ${id})`);

		return job;
	}

	async jobFindMany(config: Parameters<typeof this.db.query.Job.findMany>[0]) {
		return this.db.query.Job.findMany(config);
	}

	async jobDeleteOne(id: string) {
		return this.db.delete(Job).where(eq(Job.id, id)).execute();
	}

	async jobDeleteMany(query: SQL | undefined) {
		return this.db.delete(Job).where(query).execute();
	}

	async jobUpdateOne(id: string, data: Partial<Job>) {
		const [res] = await this.db
			.update(Job)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(Job.id, id))
			.returning();
		return res;
	}

	async jobCount(query: SQL | undefined) {
		const [res] = await this.db.select({ count: count() }).from(Job).where(query);
		return res.count;
	}
}

export type Job = InferSelectModel<Schema['Job']>;
