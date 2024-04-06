import { Job, PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1'
import { Hono } from 'hono'

export type Bindings = {
	DB: D1Database
	QUEUE: Queue
}

const JobStatus = {
	pending: "PENDING",
	processing: "PROCESSING",
	retryPending: "RETRY_PENDING",
	completed: "COMPLETED",
	failed: "FAILED",
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/jobs', async (c) => {
	const adapter = new PrismaD1(c.env.DB)
	const prisma = new PrismaClient({ adapter })

	return c.json(await prisma.job.findMany())
})

app.get('/jobs/create', async (c) => {
	const adapter = new PrismaD1(c.env.DB)
	const prisma = new PrismaClient({ adapter })

	const res = await prisma.job.create({
		data: {
			type: 'Example',
			payload: JSON.stringify({})
		}
	})

	await c.env.QUEUE.send(res)

	return c.text('OK')
})

export default {
	fetch: app.fetch,
	queue: async (batch: MessageBatch<Job>, env: Bindings): Promise<void> => {
		const adapter = new PrismaD1(env.DB)
		const prisma = new PrismaClient({ adapter })

		await Promise.allSettled(batch.messages.map(async (msg) => {
			console.log('Processing job', msg.body.id)
			const startedAt = new Date()
			await prisma.job.update({
				where: { id: msg.body.id },
				data: { status: JobStatus.processing, startedAt }
			})

			// await env[msg.body.type](msg.body.payload)
			await new Promise((resolve) => setTimeout(resolve, 10000))

			console.log('Completed job', msg.body.id)
			const completedAt = new Date()
			await prisma.job.update({
				where: { id: msg.body.id },
				data: { status: JobStatus.completed, completedAt, processingTime: completedAt.getTime() - startedAt.getTime() }
			})

			msg.ack()
		}))

		batch.ackAll()
	}
}
