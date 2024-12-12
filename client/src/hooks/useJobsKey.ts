import { createContext, useContext } from 'react';
import { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';

export type UseJobsKey = {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	pagination: PaginationState;
};

export const Context = createContext<UseJobsKey | undefined>(undefined);

export const useJobsKey = () => {
	const value = useContext(Context);
	if (!value) {
		throw new Error('useJobsKey must be used within a UseJobsKeyProvider');
	}
	return value;
};
