import { WorkerEntrypoint } from 'cloudflare:workers';

export default class extends WorkerEntrypoint {
	async fetch() {
		return new Response('OK');
	}

	async perform(payload: { delay: number; chance: number }) {
		console.log('Performing job', payload);
		const { delay, chance } = payload;

		await new Promise((resolve) => setTimeout(resolve, delay));

		if (Math.random() > chance) throw new Error('Failed to perform job');

		return { result: 'OK' };
	}
}
