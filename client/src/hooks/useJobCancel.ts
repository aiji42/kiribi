import useSWRMutation from 'swr/mutation';
import { useJobsKey } from '@/hooks/useJobsKey.ts';

export const useJobCancel = () => {
	const key = useJobsKey();
	const {
		isMutating: isCanceling,
		trigger: cancelJob,
		error: cancelError,
		reset: cancelStatusReset,
	} = useSWRMutation(key, async (_, { arg }: { arg: string }) => {
		await fetch(`/api/jobs/${arg}/cancel`, {
			method: 'PATCH',
		});
		return true;
	});

	return {
		isCanceling,
		cancelJob,
		cancelError,
		cancelStatusReset,
	};
};
