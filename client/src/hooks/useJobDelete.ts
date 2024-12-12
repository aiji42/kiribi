import useSWRMutation from 'swr/mutation';
import { useJobsKey } from '@/hooks/useJobsKey.ts';

export const useJobDelete = () => {
	const key = useJobsKey();

	const {
		isMutating: isDeleting,
		trigger: deleteJobs,
		error: deleteError,
		reset: deleteStatusReset,
	} = useSWRMutation(key, async (_, { arg }: { arg: string | string[] }) => {
		if (Array.isArray(arg)) {
			await fetch(`/api/jobs/delete`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(arg),
			});
		} else {
			await fetch(`/api/jobs/${arg}`, {
				method: 'DELETE',
			});
		}

		return true;
	});

	return {
		isDeleting,
		deleteJobs,
		deleteError,
		deleteStatusReset,
	};
};
