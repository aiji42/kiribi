// job manager worker
import { Kiribi } from 'kiribi';
import { client } from 'kiribi/client';
import { rest } from 'kiribi/rest';

export default class extends Kiribi {
	client = client;
	rest = rest;
	async scheduled() {
		// delete jobs older than 10 minutes
		await this.sweep({ createdAtLt: new Date(Date.now() - 1000 * 60 * 10), statusIn: '*' });
	}
}

// performer workers; You can split these classes into another worker
import { KiribiPerformer } from 'kiribi/performer';

export class SlowJob extends KiribiPerformer {
	async perform(payload: unknown) {
		assertPayloadForSlowJob(payload);
		await new Promise((r) => setTimeout(r, Math.max(Math.min(15000, payload.delay), 1000)));
	}
}

function assertPayloadForSlowJob(payload: unknown): asserts payload is { delay: number } {
	if (typeof payload !== 'object' || payload === null || !('delay' in payload))
		throw new Error('Invalid payload; input `{ "delay": 1000~15000 }`');
	if (typeof payload.delay !== 'number') throw new Error('Invalid payload; input `{ "delay": 1000~15000 }`');
}

export class FlakyJob extends KiribiPerformer {
	async perform(payload: unknown) {
		assertPayloadForFlakyJob(payload);
		if (Math.random() > Math.max(Math.min(1, payload.chance), 0)) throw new Error('Failed to perform job because of your daily behavior');
	}
}

function assertPayloadForFlakyJob(payload: unknown): asserts payload is { chance: number } {
	if (typeof payload !== 'object' || payload === null || !('chance' in payload))
		throw new Error('Invalid payload; input `{ "chance": 0.0~1.0 }`');
	if (typeof payload.chance !== 'number') throw new Error('Invalid payload; input `{ "chance": 0.0~1.0 }`');
}
