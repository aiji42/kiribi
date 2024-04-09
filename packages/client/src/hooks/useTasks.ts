import { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import useSWR from 'swr';

type Args = {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	pagination: PaginationState;
};

export const useTasks = (key: Args) => {
	const { data, isLoading } = useSWR(
		key,
		async ({ sorting, pagination, columnFilters }) => {
			const res = await fetch('http://localhost:9000/jobs', {
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
			refreshInterval: 1000,
		},
	);

	return { data, isLoading };
};
