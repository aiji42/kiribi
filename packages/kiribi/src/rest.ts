import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import Kiribi from './index';

type Bindings = { KIRIBI_DB: D1Database; KIRIBI_QUEUE: Queue; KIRIBI: Service<Kiribi> };

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
		const { filter, sort, page } = c.req.valid('json');

		const totalCount = await c.env.KIRIBI.count({
			where: {
				binding: filter?.binding ? { in: Array.isArray(filter.binding) ? filter.binding : [filter.binding] } : undefined,
				status: filter?.status ? { in: Array.isArray(filter.status) ? filter.status : [filter.status] } : undefined,
			},
		});

		using results = await c.env.KIRIBI.findMany({
			select: {
				id: true,
				binding: true,
				status: true,
				createdAt: true,
				startedAt: true,
				finishedAt: true,
				completedAt: true,
				processingTime: true,
				attempts: true,
				result: true,
			},
			where: {
				binding: filter?.binding ? { in: Array.isArray(filter.binding) ? filter.binding : [filter.binding] } : undefined,
				status: filter?.status ? { in: Array.isArray(filter.status) ? filter.status : [filter.status] } : undefined,
			},
			orderBy: [sort ? { [sort.key]: sort.desc ? 'desc' : 'asc' } : { id: 'desc' }, { id: 'desc' }],
			skip: page ? page.index * page.size : undefined,
			take: page ? page.size : 100,
		});

		return c.json({ results, totalCount });
	},
);

app.get('/jobs/:id', async (c) => {
	const id = c.req.param('id');
	using job = await c.env.KIRIBI.find(id);

	if (!job) throw new HTTPException(404, { message: 'Job not found' });

	return c.json(job);
});

app.delete('/jobs/:id', async (c) => {
	const id = c.req.param('id');
	await c.env.KIRIBI.delete(id);

	return c.text('OK');
});

app.patch('/jobs/:id/cancel', async (c) => {
	const id = c.req.param('id');
	await c.env.KIRIBI.cancel(id);

	return c.text('OK');
});

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

const jsonParsable = (s: string) => {
	try {
		JSON.parse(s);
		return true;
	} catch {
		return false;
	}
};

app.post(
	'/jobs/create',
	zValidator(
		'json',
		z.object({
			binding: z.string().min(1),
			payload: z.string().min(1).refine(jsonParsable, { message: 'Invalid JSON' }),
			params: z
				.object({
					maxRetries: z.number().min(1).optional(),
					retryDelay: z.union([z.number().min(0), z.object({ exponential: z.boolean(), base: z.number().min(2) })]).optional(),
					firstDelay: z.number().min(0).optional(),
				})
				.optional(),
		}),
	),
	async (c) => {
		const { binding, payload, params } = c.req.valid('json');
		await c.env.KIRIBI.enqueue(binding, JSON.parse(payload), params);

		return c.text('OK');
	},
);

export default app;
