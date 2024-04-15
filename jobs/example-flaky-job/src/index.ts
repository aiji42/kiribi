import { KiribiJobWorker } from '../../../packages/kiribi/src';

export default class extends KiribiJobWorker {
	async perform(payload: { delay: number; chance: number }) {
		console.log('Performing job', payload);
		const { delay, chance } = payload;

		await new Promise((resolve) => setTimeout(resolve, delay));

		if (Math.random() > chance) throw new Error('Failed to perform job');
	}
}
