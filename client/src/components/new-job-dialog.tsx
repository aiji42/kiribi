import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { useEffect, useReducer } from 'react';
import { useJobs } from '@/hooks/useJobs.ts';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { useAvailableBindings } from '@/hooks/useAvailableBindings.ts';

type Values = {
	binding: string;
	payload: string;
	maxRetries: number;
	exponential: boolean;
	retryDelay: number;
};

type Action =
	| {
			type: 'binding';
			value: string;
	  }
	| {
			type: 'payload';
			value: string;
	  }
	| {
			type: 'maxRetries';
			value: number;
	  }
	| {
			type: 'exponential';
			value: boolean;
	  }
	| {
			type: 'retryDelay';
			value: number;
	  }
	| {
			type: 'reset';
			value?: never;
	  };

const initialState: Values = {
	binding: '',
	payload: '',
	maxRetries: 1,
	exponential: false,
	retryDelay: 0,
};

export function NewJobDialog<TData>({
	table,
	initialData,
	trigger,
	open,
	onOpenChange,
}: {
	table: Table<TData>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: Partial<Values>;
	trigger?: React.ReactNode;
}) {
	const { data } = useAvailableBindings(open);
	const [values, dispatch] = useReducer(
		(s: Values, a: Action) => {
			switch (a.type) {
				case 'binding':
					return { ...s, binding: a.value };
				case 'payload':
					return { ...s, payload: a.value };
				case 'maxRetries':
					return { ...s, maxRetries: a.value };
				case 'exponential':
					return { ...s, exponential: a.value };
				case 'retryDelay':
					return { ...s, retryDelay: a.value };
				default:
					return initialState;
			}
		},
		{ ...initialState, ...initialData },
	);
	const { create, createCompleted, isCreating, createStatusReset } = useJobs({
		sorting: table.getState().sorting,
		columnFilters: table.getState().columnFilters,
		pagination: table.getState().pagination,
	});

	useEffect(() => {
		if (createCompleted) {
			onOpenChange(false);
			createStatusReset();
			dispatch({ type: 'reset' });
		}
	}, [createCompleted, createStatusReset, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New Job</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="bindings" className="text-right">
							Bindings
						</Label>
						<Select value={values.binding} onValueChange={(value) => dispatch({ type: 'binding', value })}>
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
							<small className="text-muted-foreground">(JSON)</small>
						</Label>
						<Textarea
							id="payload"
							className="col-span-3"
							rows={10}
							value={values.payload}
							onChange={(e) => dispatch({ type: 'payload', value: e.target.value })}
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="maxRetries" className="text-right flex flex-col">
							Max Retries
						</Label>
						<Input
							id="maxRetries"
							className="col-span-1"
							type="text"
							inputMode="numeric"
							value={values.maxRetries}
							onChange={(e) => dispatch({ type: 'maxRetries', value: +e.target.value })}
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="retryDelay" className="text-right flex flex-col">
							Retry Delay
							<small className="text-muted-foreground">(seconds)</small>
						</Label>
						<Input
							id="retryDelay"
							className="col-span-1"
							type="text"
							inputMode="numeric"
							value={values.retryDelay}
							onChange={(e) => dispatch({ type: 'retryDelay', value: +e.target.value })}
						/>
						<Label htmlFor="exponential" className="text-right flex flex-col">
							Exponential
						</Label>
						<Checkbox
							id="exponential"
							className="col-span-1"
							checked={values.exponential}
							onCheckedChange={(v) => dispatch({ type: 'exponential', value: !!v })}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="submit"
						disabled={isCreating}
						onClick={() => {
							create({
								binding: values.binding,
								payload: values.payload,
								params: {
									maxRetries: values.maxRetries,
									retryDelay: values.exponential
										? {
												exponential: true,
												base: values.retryDelay,
											}
										: values.retryDelay,
								},
							});
						}}
					>
						Add
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
