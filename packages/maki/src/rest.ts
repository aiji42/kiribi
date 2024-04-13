import { Hono } from 'hono';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from './.prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import Maki from './index';

type Bindings = { MAKI_DB: D1Database; MAKI_QUEUE: Queue; MAKI: Service<Maki> };

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

app.post(
	'/jobs',
	zValidator(
		'json',
		z.object({
			filter: z
				.object({
					binding: z.union([z.string(), z.array(z.string())]).optional(),
					status: z.union([z.string(), z.array(z.string())]).optional(),
				})
				.optional(),
			sort: z
				.object({
					key: z.string(),
					desc: z.boolean(),
				})
				.optional(),
			page: z
				.object({
					index: z.number(),
					size: z.number(),
				})
				.optional(),
		}),
	),
	async (c) => {
		const adapter = new PrismaD1(c.env.MAKI_DB);
		const prisma = new PrismaClient({ adapter });
		const { filter, sort, page } = c.req.valid('json');

		const count = prisma.job.count({
			where: {
				binding: filter?.binding ? { in: Array.isArray(filter.binding) ? filter.binding : [filter.binding] } : undefined,
				status: filter?.status ? { in: Array.isArray(filter.status) ? filter.status : [filter.status] } : undefined,
			},
		});
		const rows = prisma.job.findMany({
			where: {
				binding: filter?.binding ? { in: Array.isArray(filter.binding) ? filter.binding : [filter.binding] } : undefined,
				status: filter?.status ? { in: Array.isArray(filter.status) ? filter.status : [filter.status] } : undefined,
			},
			orderBy: [sort ? { [sort.key]: sort.desc ? 'desc' : 'asc' } : { id: 'desc' }, { id: 'desc' }],
			skip: page ? page.index * page.size : undefined,
			take: page ? page.size : 100,
		});

		return c.json({ results: await rows, totalCount: await count });
	},
);

app.get('/bindings', async (c) => {
	const bindings = await Promise.all(
		Object.entries(c.env).map(async ([name, binding]) => {
			if (!('isJobWorker' in binding)) return [name, false] as const;
			try {
				// @ts-ignore
				await binding.isJobWorker();
			} catch (_) {
				return [name, false] as const;
			}
			return [name, true] as const;
		}),
	);

	return c.json(bindings.filter(([_, isWorker]) => isWorker).map(([name]) => name));
});

app.post(
	'/jobs/create',
	zValidator(
		'json',
		z.object({
			binding: z.string(),
			payload: z.string(),
			params: z
				.object({
					maxRetries: z.number().optional(),
					retryDelay: z.union([z.number(), z.object({ exponential: z.boolean(), base: z.number() })]).optional(),
					firstDelay: z.number().optional(),
				})
				.optional(),
		}),
	),
	async (c) => {
		const { binding, payload, params } = c.req.valid('json');
		await c.env.MAKI.enqueue(binding, JSON.parse(payload), params);

		return c.text('OK');
	},
);

export default app;
