import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';
import { statuses } from '@/data/data';
import { cn } from '@/lib/utils';
import { Job } from '../../../kiribi/src/.prisma';

const DateTime = ({ value }: { value: string | null | undefined }) => {
	return (
		<div className="flex items-center">
			<span>{!value ? '' : new Date(value).toLocaleString()}</span>
		</div>
	);
};

export const columns: ColumnDef<Job>[] = [
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
