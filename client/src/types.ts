export type Job = {
	id: string;
	binding: string;
	status: 'PENDING' | 'PROCESSING' | 'RETRY_PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
	attempts: number;
	createdAt: string;
	updatedAt: string;
	startedAt: string | null;
	finishedAt: string | null;
	completedAt: string | null;
	processingTime: number | null;
};

export type JobDetails = Job & {
	payload: unknown;
	params: {
		maxRetries?: number;
		retryDelay?: number | { exponential: boolean; base: number };
		firstDelay?: number;
		timeout?: number;
	} | null;
	result:
		| {
				status: 'success' | 'failed';
				error: string | null;
				startedAt: number;
				finishedAt: number;
				processingTime: number;
		  }[]
		| null;
};
