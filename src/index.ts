import type ExampleFlakyJob from '../jobs/example-flaky-job/src/index.js';
import { Job, PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { Hono } from 'hono';

export type Bindings = {
	DB: D1Database;
	QUEUE: Queue;
	JOB: Service<ExampleFlakyJob>;
};

const JobStatus = {
	pending: 'PENDING',
	processing: 'PROCESSING',
	retryPending: 'RETRY_PENDING',
	completed: 'COMPLETED',
	failed: 'FAILED',
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/jobs', async (c) => {
	const adapter = new PrismaD1(c.env.DB);
	const prisma = new PrismaClient({ adapter });

	return c.json(await prisma.job.findMany());
});

app.get('/jobs/create', async (c) => {
	const adapter = new PrismaD1(c.env.DB);
	const prisma = new PrismaClient({ adapter });

	const res = await prisma.job.create({
		data: {
			type: 'JOB',
			payload: JSON.stringify({}),
		},
	});

	await c.env.QUEUE.send(res);

	return c.text('OK');
});

export default {
	fetch: app.fetch,
	queue: async (batch: MessageBatch<Job>, env: Bindings): Promise<void> => {
		const adapter = new PrismaD1(env.DB);
		const prisma = new PrismaClient({ adapter });

		await Promise.allSettled(
			batch.messages.map(async (msg) => {
				console.log('Processing job', msg.body.id);
				const startedAt = new Date();
				await prisma.job.update({
					where: { id: msg.body.id },
					data: { status: JobStatus.processing, startedAt },
				});

				try {
					const res = await env[msg.body.type].execute({ message: 'message' });
					console.log('Completed job', msg.body.id);
					const completedAt = new Date();

					await prisma.job.update({
						where: { id: msg.body.id },
						data: {
							status: JobStatus.completed,
							finishedAt: completedAt,
							completedAt,
							processingTime: completedAt.getTime() - startedAt.getTime(),
							result: JSON.stringify(res),
						},
					});
					msg.ack();
				} catch (e) {
					console.log('Failed job', msg.body.id, e);
					const finishedAt = new Date();

					await prisma.job.update({
						where: { id: msg.body.id },
						data: { status: JobStatus.retryPending, finishedAt, result: JSON.stringify(e), retriedCount: { increment: 1 } },
					});
					msg.retry({ delaySeconds: 3 });
				}
			}),
		);

		batch.ackAll();
	},
};
