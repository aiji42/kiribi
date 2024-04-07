import { WorkerEntrypoint } from "cloudflare:workers";

export class ExampleFlakyJob extends WorkerEntrypoint {
	async execute(payload: { message: string }) {
		console.log("Executing job", payload.message);

		await new Promise((resolve) => setTimeout(resolve, 3000))

		if (Math.random() < 0.5) throw new Error("Flaky job failed")

		return { result: "OK" }
	}
}

interface Env {
	JOB: Service<ExampleFlakyJob>;
}

export default class extends WorkerEntrypoint<Env> {
	async fetch() {
		await this.env.JOB.execute({ message: "HELLO" })
		return new Response("OK");
	}
}
