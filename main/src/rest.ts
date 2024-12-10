import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { type Kiribi } from './index';
import { listQuery } from './schema';

type Bindings = { KIRIBI_DB: D1Database; KIRIBI_QUEUE: Queue; KIRIBI: Service<Kiribi> };

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

app.post('/jobs', zValidator('json', listQuery), async (c) => {
	const { filter, sort, page } = c.req.valid('json');
	const totalCount = await c.env.KIRIBI.count(filter);
	const results = await c.env.KIRIBI.findMany({ filter, sort, page });

	return c.json({ results, totalCount });
});

app.get('/jobs/:id', async (c) => {
	const id = c.req.param('id');
	const job = await c.env.KIRIBI.find(id);

	if (!job) throw new HTTPException(404, { message: 'Job not found' });

	return c.json(job);
});

app.delete('/jobs/delete', zValidator('json', z.array(z.string()).min(1)), async (c) => {
	const ids = c.req.valid('json');
	await c.env.KIRIBI.deleteMany(ids);

	return c.text('OK');
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
			if (!(typeof binding === 'object' && 'isPerformer' in binding)) return [name, false] as const;
			try {
				// @ts-ignore
				await binding.isPerformer();
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

export const rest = app;
