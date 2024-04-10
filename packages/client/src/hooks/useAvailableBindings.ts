import useSWR from 'swr';

export const useAvailableBindings = () => {
	const { data, isLoading } = useSWR<string[]>('/bindings', async (key) => fetch(key).then((res) => res.json()), { fallbackData: [] });
	return { data, isLoading };
};
