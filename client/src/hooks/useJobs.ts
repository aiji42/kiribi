import useSWR from 'swr';
import { Job } from '@/types';

import { UseJobsKey } from '@/hooks/useJobsKey.ts';

export const useJobs = (key: UseJobsKey, autoRefresh?: boolean) => {
	const { data, isLoading } = useSWR<{ results: Job[]; totalCount: number }, never, UseJobsKey>(
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
			...(autoRefresh
				? {
						refreshInterval: 3000,
					}
				: {
						revalidateIfStale: false,
						revalidateOnFocus: false,
						revalidateOnReconnect: false,
					}),
		},
	);

	return {
		data,
		isLoading,
	};
};
