import { WorkerEntrypoint } from 'cloudflare:workers';

export default class extends WorkerEntrypoint {
	async execute(payload: { message: string }) {
		console.log('Executing job', payload.message);

		await new Promise((resolve) => setTimeout(resolve, 3000));

		if (Math.random() < 0.5) throw new Error('Flaky job failed');

		return { result: 'OK' };
	}
}
