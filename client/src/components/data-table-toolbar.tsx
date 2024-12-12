import { Cross2Icon, PlusIcon, CrossCircledIcon, DotFilledIcon, DotIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { DataTableViewOptions } from './data-table-view-options';

import { statuses } from '../data/data';
import { DataTableFilter } from './data-table-filter.tsx';
import { NewJobDialog } from '@/components/new-job-dialog.tsx';
import { useAvailableBindings } from '@/hooks/useAvailableBindings.ts';
import { useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { Job } from '@/types.ts';
import { useJobDelete } from '@/hooks/useJobDelete.ts';

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	isAutoRefreshing: boolean;
	onClickAutoRefresh: () => void;
}

export function DataTableToolbar<TData extends Job>({ table, isAutoRefreshing, onClickAutoRefresh }: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;
	const { data: bindings = [] } = useAvailableBindings(true);
	const [openNewJob, setOpenNewJob] = useState(false);
	const [openDelete, onOpenChangeDelete] = useState(false);
	const { deleteJobs } = useJobDelete();

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
						<CrossCircledIcon className="mr-2 h-4 w-4" />
						Reset
					</Button>
				)}
				{!!table.getSelectedRowModel().rows.length && (
					<Button variant="ghost" onClick={() => onOpenChangeDelete(true)} className="h-8 px-2 lg:px-3">
						<Cross2Icon className="mr-2 h-4 w-4" />
						Delete {table.getSelectedRowModel().rows.length} job(s)
					</Button>
				)}
			</div>
			<div className="flex flex-1 items-center space-x-2">
				<Button
					variant="outline"
					size="sm"
					className="ml-auto h-8"
					onClick={onClickAutoRefresh}
					title={isAutoRefreshing ? 'Pause auto refresh' : 'Enable auto refresh'}
				>
					{isAutoRefreshing ? (
						<DotFilledIcon className="size-4 text-green-400 animate-pulse" />
					) : (
						<DotIcon className="size-4 text-gray-400" />
					)}
				</Button>
				<DataTableViewOptions table={table} />
				<NewJobDialog
					open={openNewJob}
					onOpenChange={setOpenNewJob}
					trigger={
						<Button variant="outline" size="sm" className="ml-auto h-8">
							<PlusIcon className="mr-2 size-4" /> Job
						</Button>
					}
				/>
				<DeleteRowsDialog
					deleteJob={() => deleteJobs(table.getSelectedRowModel().rows.map((r) => r.original.id))}
					open={openDelete}
					onOpenChange={onOpenChangeDelete}
					count={table.getSelectedRowModel().rows.length}
				/>
			</div>
		</div>
	);
}

function DeleteRowsDialog({
	deleteJob,
	open,
	onOpenChange,
	count,
}: {
	deleteJob: VoidFunction;
	open: boolean;
	onOpenChange: (o: boolean) => void;
	count: number;
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete jobs</AlertDialogTitle>
					<AlertDialogDescription>Are you sure you want to delete the selected {count} job(s)?</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={deleteJob}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
