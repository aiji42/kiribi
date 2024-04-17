import { WorkerEntrypoint } from 'cloudflare:workers';

abstract class JobWorker<P extends unknown = any> extends WorkerEntrypoint {
	fetch() {
		return new Response('This is Kiribi Job Worker');
	}
	isJobWorker() {
		return true;
	}

	abstract perform(payload: P): void | Promise<void>;
}

export default JobWorker;
