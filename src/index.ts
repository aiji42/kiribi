import { Hono } from 'hono';
import { z } from 'zod';
import { validator } from 'hono/validator';
// @ts-ignore
import newHTML from './new.html';
import type Maki from '../packages/maki/src/worker.js';

export type Bindings = {
	DB: D1Database;
	QUEUE: Queue;
	MAKI: Service<Maki>;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/jobs', async (c) => {
	return c.json(await c.env.MAKI.list());
});

app.get('/jobs/new', async (c) => {
	return c.html(newHTML);
});

const makeSchema = (env: Bindings) =>
	z.object({
		type: z.string(),
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
		const { type, payload } = c.req.valid('json');
		await c.env.MAKI.enqueue(type, JSON.parse(payload));

		return c.text('OK');
	},
);

export default app;
