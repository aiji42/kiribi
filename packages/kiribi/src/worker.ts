import _Kiribi from './index';
import rest from './rest';
import clientEntry from './client-entry';
import { Hono } from 'hono';

const app = new Hono();
app.route('/', rest);
app.route('/', clientEntry);

export class Kiribi extends _Kiribi {}

export default class extends Kiribi {
	async fetch(req: Request) {
		return app.fetch(req, this.env, this.ctx);
	}
}
