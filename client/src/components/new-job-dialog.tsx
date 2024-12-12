import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { useCallback, useReducer } from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { useAvailableBindings } from '@/hooks/useAvailableBindings.ts';
import { JobDetails } from '@/types.ts';
import { CreateJobValue, useJobCreate, ValidationError } from '@/hooks/useJobCreate.ts';
import { cn } from '@/lib/utils.ts';

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

const initialState: CreateJobValue = {
	binding: '',
	payload: '',
	maxRetries: 1,
	exponential: false,
	retryDelay: 0,
};

const mergeData = (initialData?: JobDetails) => ({
	binding: initialData?.binding || initialState.binding,
	payload: initialData?.payload ? JSON.stringify(initialData.payload, null, 2) : initialState.payload,
	maxRetries: initialData?.params?.maxRetries || initialState.maxRetries,
	exponential: typeof initialData?.params?.retryDelay === 'object' ? initialData.params.retryDelay.exponential : initialState.exponential,
	retryDelay:
		typeof initialData?.params?.retryDelay === 'object'
			? initialData.params.retryDelay.base
			: initialData?.params?.retryDelay || initialState.retryDelay,
});

export function NewJobDialog({
	initialData,
	trigger,
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: JobDetails;
	trigger?: React.ReactNode;
}) {
	const { data } = useAvailableBindings(open);
	const { createJob, isCreating, createError, createStatusReset } = useJobCreate();
	const validationError = createError instanceof ValidationError ? createError : undefined;
	const [values, dispatch] = useReducer((s: CreateJobValue, a: Action) => {
		createStatusReset();
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
				return mergeData(initialData);
		}
	}, mergeData(initialData));

	const submit = useCallback(() => {
		createJob(values, () => {
			onOpenChange(false);
			dispatch({ type: 'reset' });
		});
	}, [createJob, onOpenChange, values]);

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
						<div className="col-span-3">
							<Select value={values.binding} onValueChange={(value) => dispatch({ type: 'binding', value })}>
								<SelectTrigger className={cn(validationError?.invalid('binding') && 'border-red-600 border-2')} id="bindings">
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
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="payload" className="text-right flex flex-col">
							Payload
							<small className="text-muted-foreground">(JSON)</small>
						</Label>
						<div className="col-span-3">
							<Textarea
								id="payload"
								className={cn(validationError?.invalid('payload') && 'border-red-600 border-2')}
								rows={10}
								value={values.payload}
								onChange={(e) => dispatch({ type: 'payload', value: e.target.value })}
							/>
							{validationError?.getMessages('payload').map((m, i) => (
								<p key={i} className="text-red-600 text-xs">
									{m}
								</p>
							))}
						</div>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="maxRetries" className="text-right flex flex-col">
							Max Retries
						</Label>
						<Input
							id="maxRetries"
							className={cn('col-span-1', validationError?.invalid('maxRetries') && 'border-red-600 border-2')}
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
							className={cn('col-span-1', validationError?.invalid('retryDelay') && 'border-red-600 border-2')}
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
					<Button type="submit" disabled={isCreating} onClick={submit}>
						Add
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
