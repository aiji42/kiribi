import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { DataTableViewOptions } from './data-table-view-options';

import { statuses } from '../data/data';
import { DataTableFilter } from './data-table-filter.tsx';
import { NewJobDialog } from '@/components/new-job-dialog.tsx';
import { useAvailableBindings } from '@/hooks/useAvailableBindings.ts';
import { useState } from 'react';

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;
	const { data: bindings = [] } = useAvailableBindings(true);
	const [open, setOpen] = useState(false);

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				{table.getColumn('binding') && (
					<DataTableFilter
						column={table.getColumn('binding')}
						title="Binding"
						options={bindings.map((binding) => ({ value: binding, label: binding }))}
					/>
				)}
				{table.getColumn('status') && <DataTableFilter column={table.getColumn('status')} title="Status" options={statuses} />}
				{isFiltered && (
					<Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
						Reset
						<Cross2Icon className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<div className="flex flex-1 items-center space-x-2">
				<DataTableViewOptions table={table} />
				<NewJobDialog
					table={table}
					open={open}
					onOpenChange={setOpen}
					trigger={
						<Button variant="outline" size="sm" className="ml-auto h-8">
							<PlusIcon className="mr-2 size-4" /> Job
						</Button>
					}
				/>
			</div>
		</div>
	);
}
