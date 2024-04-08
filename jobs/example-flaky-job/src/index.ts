import { WorkerEntrypoint } from 'cloudflare:workers';
import { MakiJobWorker } from '../../../packages/maki/src';

export default class extends WorkerEntrypoint implements MakiJobWorker {
	async perform(payload: { delay: number; chance: number }) {
		console.log('Performing job', payload);
		const { delay, chance } = payload;

		await new Promise((resolve) => setTimeout(resolve, delay));

		if (Math.random() > chance) throw new Error('Failed to perform job');

		return { result: 'OK' };
	}
}
