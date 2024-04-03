import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { Hono } from 'hono'

export type Bindings = {
	DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
	const adapter = new PrismaD1(c.env.DB)
	const prisma = new PrismaClient({ adapter })

	return c.json(await prisma.job.findMany())
})

export default app
