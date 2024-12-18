import { DotsHorizontalIcon, CopyIcon, Cross2Icon, MinusCircledIcon } from '@radix-ui/react-icons';
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
import { NewJobDialog } from '@/components/new-job-dialog.tsx';
import { Job } from '@/types.ts';
import { useJobDetails } from '@/hooks/useJobDetails.ts';
import { useJobDelete } from '@/hooks/useJobDelete.ts';
import { useJobCancel } from '@/hooks/useJobCancel.ts';

interface DataTableRowActionsProps<TData extends Job> {
	row: Row<TData>;
	table: Table<TData>;
}

export function DataTableRowActions<TData extends Job>({ row }: DataTableRowActionsProps<TData>) {
	const [openDelete, onOpenChangeDelete] = useState(false);
	const [openCancel, onOpenChangeCancel] = useState(false);
	const [openCopy, onOpenChangeCopy] = useState(false);
	const { data } = useJobDetails(openCopy ? row.original.id : undefined);
	const { deleteJobs } = useJobDelete();
	const { cancelJob } = useJobCancel();

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
					<DropdownMenuItem onClick={() => onOpenChangeDelete(true)}>
						<Cross2Icon className="size-4 mr-1 text-muted-foreground" />
						Delete
					</DropdownMenuItem>
					{['PENDING', 'RETRY_PENDING'].includes(row.getValue('status')) && (
						<DropdownMenuItem onClick={() => onOpenChangeCancel(true)}>
							<MinusCircledIcon className="size-4 mr-1 text-muted-foreground" />
							Cancel
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={() => onOpenChangeCopy(true)}>
						<CopyIcon className="size-4 mr-1 text-muted-foreground" />
						Duplicate
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<DeleteRowDialog deleteJob={() => deleteJobs(row.original.id)} open={openDelete} onOpenChange={onOpenChangeDelete} />
			<CancelRowDialog cancel={() => cancelJob(row.original.id)} open={openCancel} onOpenChange={onOpenChangeCancel} />
			{data && <NewJobDialog open={openCopy} onOpenChange={onOpenChangeCopy} initialData={data} />}
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
