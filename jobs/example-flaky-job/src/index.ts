import { WorkerEntrypoint } from 'cloudflare:workers';

export default class extends WorkerEntrypoint {
	async fetch() {
		return new Response('OK');
	}

	async execute(payload: { delay: number; chanceOfSuccess: number }) {
		console.log('Executing job', payload);
		const { delay, chanceOfSuccess } = payload;

		await new Promise((resolve) => setTimeout(resolve, delay));

		if (Math.random() > chanceOfSuccess) throw new Error('Flaky job failed');

		return { result: 'OK' };
	}
}
