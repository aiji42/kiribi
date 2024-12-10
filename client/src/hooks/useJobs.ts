import { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { Job } from '@/types.ts';

export type UseJobsArgs = {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	pagination: PaginationState;
};

export const useJobs = (key: UseJobsArgs) => {
	const { data, isLoading } = useSWR<{ results: Job[]; totalCount: number }, never, UseJobsArgs>(
		key,
		async ({ sorting, pagination, columnFilters }) => {
			const res = await fetch('/api/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					filter: {
						binding: columnFilters.find((f) => f.id === 'binding')?.value,
						status: columnFilters.find((f) => f.id === 'status')?.value,
					},
					page: {
						index: pagination.pageIndex,
						size: pagination.pageSize,
					},
					sort: sorting[0] && { key: sorting[0].id, desc: sorting[0].desc },
				}),
			});
			return res.json();
		},
		{
			keepPreviousData: true,
			fallbackData: { results: [], totalCount: 0 },
			refreshInterval: 3000,
		},
	);

	const {
		data: createCompleted,
		isMutating: isCreating,
		trigger: create,
		error: createError,
		reset: createStatusReset,
	} = useSWRMutation(
		key,
		async (
			_,
			{
				arg,
			}: {
				arg: {
					binding: string;
					payload: string;
					params?: { maxRetries?: number; retryDelay?: number | { exponential: true; base: number } };
				};
			},
		) => {
			const res = await fetch('/api/jobs/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(arg),
			});
			if (res.ok) return true;
			throw new Error(await res.text());
		},
	);

	const {
		isMutating: isDeleting,
		trigger: deleteJob,
		error: deleteError,
		reset: deleteStatusReset,
	} = useSWRMutation(key, async (_, { arg }: { arg: string }) => {
		await fetch(`/api/jobs/${arg}`, {
			method: 'DELETE',
		});
		return true;
	});

	const {
		isMutating: isDeletingMany,
		trigger: deleteMany,
		error: deleteManyError,
		reset: deleteManyStatusReset,
	} = useSWRMutation(key, async (_, { arg }: { arg: string[] }) => {
		await fetch(`/api/jobs/delete`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(arg),
		});
	});

	const {
		isMutating: isCanceling,
		trigger: cancel,
		error: cancelError,
		reset: cancelStatusReset,
	} = useSWRMutation(key, async (_, { arg }: { arg: string }) => {
		await fetch(`/api/jobs/${arg}/cancel`, {
			method: 'PATCH',
		});
		return true;
	});

	return {
		data,
		isLoading,
		create,
		createCompleted,
		isCreating,
		createError,
		createStatusReset,
		isDeleting,
		deleteJob,
		deleteError,
		deleteStatusReset,
		isCanceling,
		cancel,
		cancelError,
		cancelStatusReset,
		isDeletingMany,
		deleteMany,
		deleteManyError,
		deleteManyStatusReset,
	};
};
