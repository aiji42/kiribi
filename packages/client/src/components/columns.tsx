import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';
import { statuses, subStatuses } from '@/data/data';
import { cn } from '@/lib/utils';
import { Job } from '../../../kiribi/src/.prisma';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button.tsx';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const DateTime = ({ value }: { value: string | null | undefined }) => {
	return (
		<div className="flex items-center">
			<span>{!value ? '' : new Date(value).toLocaleString()}</span>
		</div>
	);
};

export const columns: ColumnDef<Job>[] = [
	{
		id: 'expand',
		cell: ({ row }) => {
			return (
				<div className="flex items-center">
					{row.getCanExpand() && (
						<Button variant="ghost" className="size-8 p-0" onClick={row.getToggleExpandedHandler()}>
							<ChevronRightIcon className={cn('size-4 transition-transform', row.getIsExpanded() && 'transform rotate-90')} />
						</Button>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: 'binding',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Binding" />,
		cell: ({ row }) => {
			return (
				<div className="flex items-center">
					<span>{row.getValue('binding')}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'status',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => {
			if (row.depth) {
				const status = subStatuses.find((status) => status.value === row.getValue('status'));
				if (!status) return null;
				return (
					<div className="w-[100px] pl-2">
						<HoverCard>
							<HoverCardTrigger className="flex items-center">
								{status.icon && <status.icon className={cn('mr-2 h-4 w-4', status.color)} />}
								<span>{status.label}</span>
							</HoverCardTrigger>
							{/* @ts-ignore */}
							<HoverCardContent>{row.original.error}</HoverCardContent>
						</HoverCard>
					</div>
				);
			}

			const status = statuses.find((status) => status.value === row.getValue('status'));

			if (!status) {
				return null;
			}

			return (
				<div className="flex w-[100px] items-center">
					{status.icon && <status.icon className={cn('mr-2 h-4 w-4', status.pulse && 'animate-pulse', status.color)} />}
					<span>{status.label}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Created at" />,
		cell: ({ row }) => {
			const value = row.getValue<string | null>('createdAt');
			return <DateTime value={value} />;
		},
	},
	{
		accessorKey: 'startedAt',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Started at" />,
		cell: ({ row }) => {
			const value = row.getValue<string | null>('startedAt');
			return <DateTime value={value} />;
		},
	},
	{
		accessorKey: 'finishedAt',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Finished at" />,
		cell: ({ row }) => {
			const value = row.getValue<string | null>('finishedAt');
			return <DateTime value={value} />;
		},
	},
	{
		accessorKey: 'completedAt',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Completed at" />,
		cell: ({ row }) => {
			const value = row.getValue<string | null>('completedAt');
			return <DateTime value={value} />;
		},
	},
	{
		accessorKey: 'attempts',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Attempts" />,
		cell: ({ row }) => {
			const value = row.getValue<number>('attempts');
			return (
				<div className="flex items-center">
					<span>{value}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'processingTime',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Processing time" />,
		cell: ({ row }) => {
			const value = row.getValue('processingTime');
			return (
				<div className="flex items-center">
					<span>{value === null ? '' : `${Number(value).toLocaleString()} ms`}</span>
				</div>
			);
		},
	},
	{
		id: 'actions',
		cell: ({ row, table }) => <DataTableRowActions row={row} table={table} />,
	},
];
