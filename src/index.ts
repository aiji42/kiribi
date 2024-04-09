import { Hono } from 'hono';
import { z } from 'zod';
import { validator } from 'hono/validator';
import type Maki from '../packages/maki/src/worker.js';

export type Bindings = {
	DB: D1Database;
	QUEUE: Queue;
	MAKI: Service<Maki>;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/jobs', async (c) => {
	using list = await c.env.MAKI.list(await c.req.json());
	return c.json(list);
});

app.get('/bindings', async (c) => {
	using available = await c.env.MAKI.availableBindings();
	return c.json(available);
});

const makeSchema = (env: Bindings) =>
	z.object({
		binding: z.string(),
		payload: z.string(),
	});

app.post(
	'/jobs/create',
	validator('json', (value, c) => {
		const schema = makeSchema(c.env);
		const parsed = schema.safeParse(value);
		if (!parsed.success) return c.text('Invalid!', 401);
		return parsed.data;
	}),
	async (c) => {
		const { binding, payload } = c.req.valid('json');
		await c.env.MAKI.enqueue(binding, JSON.parse(payload));

		return c.text('OK');
	},
);

// import { serveStatic } from 'hono/cloudflare-workers';
// import manifest from '__STATIC_CONTENT_MANIFEST';
// app.get('*', serveStatic({ root: './', manifest }));

export default app;
