import { serveStatic } from 'hono/cloudflare-workers';
import manifest from '__STATIC_CONTENT_MANIFEST';
import { Hono } from 'hono';

const app = new Hono();

app.get('*', serveStatic({ root: './', manifest }));

export const client = app;
