import {
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	useReactTable,
	ExpandedState,
	RowSelectionState,
	getExpandedRowModel,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import { columns } from '@/components/columns';
import { Spinner } from '@/components/spinner.tsx';
import { useJobs } from '@/hooks/useJobs.ts';
import useLocalStorage from 'use-local-storage';
import { Fragment, useMemo, useReducer, useState } from 'react';
import { JobDetailsShow } from '@/components/ui/job-details-show.tsx';
import { UseJobsKeyProvider } from '@/hooks/use-jobs-key-provider.tsx';

export function DataTable() {
	const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>('visibilityState', {
		createdAt: false,
		completedAt: false,
	});
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
	const [pageSize, setPageSize] = useLocalStorage<number>('pageSize', 10);
	const [pageIndex, setPageIndex] = useState(0);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [expanded, setExpanded] = useState<ExpandedState>({});
	const [autoRefresh, toggleAutoRefresh] = useReducer((state) => !state, true);

	const key = useMemo(
		() => ({ sorting, pagination: { pageSize, pageIndex }, columnFilters }),
		[columnFilters, pageIndex, pageSize, sorting],
	);
	const { data, isLoading } = useJobs(key, autoRefresh);

	const table = useReactTable({
		data: data?.results ?? [],
		columns,
		state: {
			sorting,
			columnVisibility,
			columnFilters,
			pagination: { pageSize, pageIndex },
			rowSelection,
			expanded,
		},
		getRowId: (row) => row.id,
		manualPagination: true,
		onExpandedChange: setExpanded,
		pageCount: Math.ceil((data?.totalCount ?? 0) / pageSize),
		onSortingChange: setSorting,
		onColumnFiltersChange: (fn) => {
			setPageIndex(0);
			setColumnFilters(fn);
		},
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		onColumnVisibilityChange: (fn) => setColumnVisibility(fn(columnVisibility)),
		onPaginationChange: (fn) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const newPagination = fn({ pageIndex, pageSize });
			setPageIndex(newPagination.pageIndex);
			setPageSize(newPagination.pageSize);
		},
		getCoreRowModel: getCoreRowModel(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		getExpandedRowModel: getExpandedRowModel(),
		getRowCanExpand: () => true,
	});

	return (
		<UseJobsKeyProvider value={key}>
			<div className="space-y-4">
				<DataTableToolbar table={table} isAutoRefreshing={autoRefresh} onClickAutoRefresh={toggleAutoRefresh} />
				<div className="rounded-md border relative">
					{isLoading && <Spinner size={48} className="opacity-60 absolute inset-1/2 z-10" />}
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id} colSpan={header.colSpan}>
												{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<Fragment key={row.id}>
										<TableRow>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
											))}
										</TableRow>
										{row.getIsExpanded() && (
											<TableRow>
												<TableCell colSpan={row.getVisibleCells().length}>
													<div className="max-w-screen-md">
														<JobDetailsShow id={row.original.id} />
													</div>
												</TableCell>
											</TableRow>
										)}
									</Fragment>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-24 text-center">
										{!isLoading && 'No results.'}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<DataTablePagination table={table} />
			</div>
		</UseJobsKeyProvider>
	);
}
