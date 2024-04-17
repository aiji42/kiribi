// job manager worker
import { Kiribi } from 'kiribi';
import { client } from 'kiribi/client';
import { rest } from 'kiribi/rest';

export default class extends Kiribi {
	client = client;
	rest = rest;
}

// performer workers; You can split these classes into another worker
import { KiribiWorker } from 'kiribi/worker';

export class SlowJob extends KiribiWorker {
	async perform(payload: number | string) {
		await new Promise((r) => setTimeout(r, payload ? Number(payload) : 30000));
	}
}

export class FlakyJob extends KiribiWorker {
	async perform(payload: number | string) {
		const chance = payload ? Number(payload) : 0.5;
		if (Math.random() > chance) throw new Error('Failed to perform job because of your daily behavior');
	}
}
