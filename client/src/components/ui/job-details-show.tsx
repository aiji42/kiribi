import { Spinner } from '@/components/spinner.tsx';
import { useJobDetails } from '@/hooks/useJobDetails.ts';

export const JobDetailsShow = ({ id }: { id: string }) => {
	const { data, isLoading } = useJobDetails(id);

	if (isLoading) return <Spinner />;

	if (!data) return null;

	return (
		<dl className="space-y-4">
			<div className="grid grid-cols-4 gap-4">
				<dt className="text-muted-foreground">ID</dt>
				<dd className="col-span-3">{data.id}</dd>
			</div>
			<div className="grid grid-cols-4 gap-4">
				<dt className="text-muted-foreground">CreatedAt</dt>
				<dd className="col-span-3">
					<pre>{new Date(data.createdAt).toLocaleString()}</pre>
				</dd>
			</div>
			<div className="grid grid-cols-4 gap-4">
				<dt className="text-muted-foreground">Payload</dt>
				<dd className="col-span-3">
					<pre>{JSON.stringify(data.payload, null, 2)}</pre>
				</dd>
			</div>
			<div className="grid grid-cols-4 gap-4">
				<dt className="text-muted-foreground">Params</dt>
				<dd className="col-span-3">
					<pre>{JSON.stringify(data.params)}</pre>
				</dd>
			</div>
			<div className="grid grid-cols-4 gap-4">
				<dt className="text-muted-foreground">Result</dt>
				<dd className="col-span-3 space-y-4">
					{data.result?.map((res, index) => (
						<div key={index}>
							<p className="mb-1">#{index + 1}</p>
							<dl className="space-y-1.5">
								<div className="grid grid-cols-4 gap-4">
									<dt className="text-muted-foreground">Status</dt>
									<dd className="col-span-3">
										{res.status.replace(/(^[a-z])(.*)/g, (_, first, rest) => first.toUpperCase() + rest.toLowerCase())}
									</dd>
								</div>
								<div className="grid grid-cols-4 gap-4">
									<dt className="text-muted-foreground">StartedAt</dt>
									<dd className="col-span-3">{new Date(res.startedAt).toLocaleString()}</dd>
								</div>
								<div className="grid grid-cols-4 gap-4">
									<dt className="text-muted-foreground">FinishedAt</dt>
									<dd className="col-span-3">{new Date(res.finishedAt).toLocaleString()}</dd>
								</div>
								<div className="grid grid-cols-4 gap-4">
									<dt className="text-muted-foreground">Processing Time</dt>
									<dd className="col-span-3">{res.processingTime.toLocaleString()} ms</dd>
								</div>
								{res.error && (
									<div className="grid grid-cols-4 gap-4">
										<dt className="text-muted-foreground">Error</dt>
										<dd className="col-span-3">
											<pre>{res.error}</pre>
										</dd>
									</div>
								)}
							</dl>
						</div>
					))}
				</dd>
			</div>
		</dl>
	);
};
