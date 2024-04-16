import { WorkerEntrypoint } from 'cloudflare:workers';

export abstract class KiribiJobWorker<P extends unknown = any> extends WorkerEntrypoint {
	fetch() {
		return new Response('This is Kiribi Job Worker');
	}
	isJobWorker() {
		return true;
	}

	abstract perform(payload: P): void | Promise<void>;
}
