import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row, Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useJobs } from '@/hooks/useJobs.ts';
import { NewJobDialog } from '@/components/new-job-dialog.tsx';
import { type Job } from '../../../main/src/db';

interface DataTableRowActionsProps<TData extends Job> {
	row: Row<TData>;
	table: Table<TData>;
}

export function DataTableRowActions<TData extends Job>({ row, table }: DataTableRowActionsProps<TData>) {
	const [openDelete, onOpenChangeDelete] = useState(false);
	const [openCancel, onOpenChangeCancel] = useState(false);
	const [openCopy, onOpenChangeCopy] = useState(false);
	const { deleteJob, cancel } = useJobs({
		sorting: table.getState().sorting,
		columnFilters: table.getState().columnFilters,
		pagination: table.getState().pagination,
	});

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
						<DotsHorizontalIcon className="h-4 w-4" />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[160px]">
					<DropdownMenuItem onClick={() => onOpenChangeDelete(true)}>Delete</DropdownMenuItem>
					{['PENDING', 'RETRY_PENDING'].includes(row.getValue('status')) && (
						<DropdownMenuItem onClick={() => onOpenChangeCancel(true)}>Cancel</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={() => onOpenChangeCopy(true)}>Duplicate</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<DeleteRowDialog deleteJob={() => deleteJob(row.original.id)} open={openDelete} onOpenChange={onOpenChangeDelete} />
			<CancelRowDialog cancel={() => cancel(row.original.id)} open={openCancel} onOpenChange={onOpenChangeCancel} />
			<NewJobDialog
				table={table}
				open={openCopy}
				onOpenChange={onOpenChangeCopy}
				initialData={{
					binding: row.original.binding,
					payload: JSON.stringify(row.original.payload, null, 2),
					maxRetries: row.original.params?.maxRetries,
					retryDelay:
						typeof row.original.params?.retryDelay === 'object' ? row.original.params?.retryDelay.base : row.original.params?.retryDelay,
					exponential: typeof row.original.params?.retryDelay === 'object' ? row.original.params?.retryDelay.exponential : false,
				}}
			/>
		</>
	);
}

const DeleteRowDialog = ({
	deleteJob,
	open,
	onOpenChange,
}: {
	deleteJob: VoidFunction;
	open: boolean;
	onOpenChange: (o: boolean) => void;
}) => {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete job</AlertDialogTitle>
					<AlertDialogDescription>Are you sure you want to delete this job? This action cannot be undone.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={deleteJob}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

const CancelRowDialog = ({ cancel, open, onOpenChange }: { cancel: VoidFunction; open: boolean; onOpenChange: (o: boolean) => void }) => {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel pending job</AlertDialogTitle>
					<AlertDialogDescription>Are you sure you want to cancel this job? This action cannot be undone.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Close</AlertDialogCancel>
					<AlertDialogAction onClick={cancel}>Cancel job</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
