import { FC, ReactNode } from 'react';
import { Context as Context1, UseJobsKey } from '@/hooks/useJobsKey.ts';

export const UseJobsKeyProvider: FC<{
	value: UseJobsKey;
	children: ReactNode;
}> = ({ value, children }) => {
	return <Context1 value={value}>{children}</Context1>;
};
