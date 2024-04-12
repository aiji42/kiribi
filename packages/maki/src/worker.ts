import _Maki from './index';
import rest from './rest';
import clientEntry from './client-entry';
import { Hono } from 'hono';

const app = new Hono();
app.route('/', rest);
app.route('/', clientEntry);

export class Maki extends _Maki {}

export default class extends Maki {
	async fetch(req: Request) {
		return app.fetch(req, this.env, this.ctx);
	}
}
