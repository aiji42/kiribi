import { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

export type UseTasksArgs = {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	pagination: PaginationState;
};

export const useTasks = (key: UseTasksArgs) => {
	const { data, isLoading } = useSWR(
		key,
		async ({ sorting, pagination, columnFilters }) => {
			const res = await fetch('/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					filter: {
						type: columnFilters.find((f) => f.id === 'type')?.value,
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
			{ arg }: { arg: { binding: string; payload: string; params?: { maxRetries?: number; retryDelay?: number; exponential?: boolean } } },
		) => {
			const res = await fetch('/jobs/create', {
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

	return { data, isLoading, create, createCompleted, isCreating, createError, createStatusReset };
};
