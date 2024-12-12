import useSWRMutation from 'swr/mutation';
import { useCallback } from 'react';
import { UseJobsKey, useJobsKey } from '@/hooks/useJobsKey.ts';

export type CreateJobValue = {
	binding: string;
	payload: string;
	maxRetries: number;
	exponential: boolean;
	retryDelay: number;
};

type ValidationErrorResponse = {
	success: false;
	error: {
		name: 'ZodError';
		issues: {
			code: string;
			path: ['binding' | 'payload'] | ['params', 'maxRetries'] | ['params', 'retryDelay'];
			message: string;
		}[];
	};
};

export class ValidationError extends Error {
	readonly errors: Record<string, string[]> = {};
	constructor(public response: ValidationErrorResponse) {
		super('Validation Error');
		response.error.issues.forEach((issue) => {
			const key = issue.path.at(-1)!;
			if (this.errors[key] === undefined) this.errors[key] = [];
			this.errors[key].push(issue.message);
		});
	}

	invalid(key: 'binding' | 'payload' | 'maxRetries' | 'exponential' | 'retryDelay') {
		return this.errors[key] !== undefined;
	}

	getMessages(key: 'binding' | 'payload' | 'maxRetries' | 'exponential' | 'retryDelay') {
		return this.errors[key] || [];
	}
}

export const useJobCreate = () => {
	const key = useJobsKey();

	const {
		data: createCompleted,
		isMutating: isCreating,
		trigger: create,
		error: createError,
		reset: createStatusReset,
	} = useSWRMutation<boolean, Error | ValidationError, UseJobsKey, CreateJobValue>(key, async (_, { arg }) => {
		const res = await fetch('/api/jobs/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				binding: arg.binding,
				payload: arg.payload,
				params: {
					maxRetries: arg.maxRetries,
					retryDelay: arg.exponential ? { exponential: true, base: arg.retryDelay } : arg.retryDelay,
				},
			}),
		});
		if (res.ok) return true;
		if (res.status === 400) {
			throw new ValidationError(await res.json());
		}
		throw new Error(await res.text());
	});

	const createJob = useCallback(
		async (value: CreateJobValue, callback?: VoidFunction) => {
			await create(value);
			createStatusReset();
			callback?.();
		},
		[create, createStatusReset],
	);

	return {
		createCompleted,
		isCreating,
		createError,
		createJob,
		createStatusReset,
	};
};
