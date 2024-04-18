import { WorkerEntrypoint } from 'cloudflare:workers';

export abstract class KiribiPerformer<P extends unknown = any> extends WorkerEntrypoint {
	fetch() {
		return new Response('This is Kiribi Performer');
	}
	isPerformer() {
		return true;
	}

	abstract perform(payload: P): void | Promise<void>;
}
