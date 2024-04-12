import useSWR from 'swr';

export const useAvailableBindings = (available: boolean) => {
	const { data, isLoading } = useSWR<string[]>(available ? '/api/bindings' : null, async (key) => fetch(key).then((res) => res.json()), {
		fallbackData: [],
	});
	return { data, isLoading };
};
