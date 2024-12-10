export type Job = {
	id: string;
	binding: string;
	status: string;
	payload: unknown;
	params?: {
		maxRetries?: number;
		retryDelay?: number | { exponential: true; base: number };
	};
	error?: string;
	result?: { status: string }[];
};
