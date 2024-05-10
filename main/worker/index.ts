import { FailureHandlerMeta, Kiribi, SuccessHandlerMeta } from '../src';
import { KiribiPerformer } from '../src/performer';
import { client } from '../src/client';
import { rest } from '../src/rest';

export default class extends Kiribi {
	client = client;
	rest = rest;
	async onSuccess(binding: string, payload: any, result: any, meta: SuccessHandlerMeta) {
		console.log(result);
		console.log('onSuccess', binding, payload, meta);
	}
	async onFailure(binding: string, payload: any, error: Error, meta: FailureHandlerMeta) {
		console.log('onFail', binding, payload, meta);
		console.log(error);
	}

	async scheduled() {
		await this.sweep({ olderThan: 1000, statuses: '*' });
	}
}

// you can split this class into another worker
export class SlowJob extends KiribiPerformer {
	async perform(payload: number | string) {
		await new Promise((r) => setTimeout(r, payload ? Number(payload) : 30000));
		return 'finished';
	}
}

export class FlakyJob extends KiribiPerformer {
	async perform(payload: number | string) {
		const chance = payload ? Number(payload) : 0.5;
		if (Math.random() > chance) throw new Error('Failed to perform job because of your daily behavior');
		return 'finished';
	}
}
