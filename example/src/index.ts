import Kiribi from 'kiribi';
import client from 'kiribi/client';
import rest from 'kiribi/rest';
import { KiribiJobWorker } from 'kiribi/job-worker';

export default class extends Kiribi {
	client = client;
	rest = rest;
}

// you can split this class into another worker
export class ExampleFlakyJob extends KiribiJobWorker {
	async perform(payload: { delay: number; chance: number }) {
		console.log('Performing job', payload);
		const { delay, chance } = payload;

		await new Promise((resolve) => setTimeout(resolve, delay));

		if (Math.random() > chance) throw new Error('Failed to perform job');
	}
}
