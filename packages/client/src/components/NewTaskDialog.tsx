import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusIcon } from '@radix-ui/react-icons';
import { Textarea } from '@/components/ui/textarea.tsx';
import useSWR from 'swr';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { useEffect, useState } from 'react';
import { useTasks } from '@/hooks/useTasks.ts';
import { Table } from '@tanstack/react-table';

const useAvailableBindings = () => {
	const { data, isLoading } = useSWR<string[]>('/bindings', async (key) => fetch(key).then((res) => res.json()), { fallbackData: [] });
	return { data, isLoading };
};

export function NewTaskDialog<TData>({ table }: { table: Table<TData> }) {
	const [open, setOpen] = useState(false);
	const { data } = useAvailableBindings();
	const [binding, setBinding] = useState('');
	const [payload, setPayload] = useState('');
	const { create, createCompleted, isCreating } = useTasks({
		sorting: table.getState().sorting,
		columnFilters: table.getState().columnFilters,
		pagination: table.getState().pagination,
	});

	useEffect(() => {
		if (createCompleted) setOpen(false);
	}, [createCompleted]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="ml-auto h-8">
					<PlusIcon />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New Task</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="bindings" className="text-right">
							Bindings
						</Label>
						<Select value={binding} onValueChange={setBinding}>
							<SelectTrigger className="w-[180px] col-span-3" id="bindings">
								<SelectValue placeholder="Select a binding" />
							</SelectTrigger>
							<SelectContent>
								{data?.map((v) => (
									<SelectItem value={v} key={v}>
										{v}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="payload" className="text-right flex flex-col">
							Payload
							<div className="text-xs font-normal text-muted-foreground">(JSON)</div>
						</Label>
						<Textarea id="payload" className="col-span-3" rows={10} value={payload} onChange={(e) => setPayload(e.target.value)} />
					</div>
				</div>
				<DialogFooter>
					<Button
						type="submit"
						disabled={isCreating}
						onClick={() => {
							create({ binding, payload });
						}}
					>
						Add
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
