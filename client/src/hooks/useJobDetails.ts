import useSWR from 'swr';
import { JobDetails } from '@/types.ts';

export const useJobDetails = (id?: string) => {
	const { data, isLoading } = useSWR<JobDetails, never, string | null>(id ? `/api/jobs/${id}` : null, async (key) => {
		const res = await fetch(key);
		return res.json();
	});

	return { data, isLoading };
};
