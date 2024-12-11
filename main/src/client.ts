import { serveStatic } from 'hono/cloudflare-workers';
import manifest from '__STATIC_CONTENT_MANIFEST';
import { Hono } from 'hono';
import { BlankEnv, BlankSchema } from 'hono/types';

const app: Hono<BlankEnv, BlankSchema, '/'> = new Hono();

app.get('*', serveStatic({ root: './', manifest }));

const client = app;

export { client };

// Workaround for `The inferred type of 'client' cannot be named without a reference to 'kiribi/node_modules/hono'. This is likely not portable. A type annotation is necessary.`
export type { Hono } from 'hono';
export type { BlankEnv, BlankSchema } from 'hono/types';
