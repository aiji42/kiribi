import { DataTable } from './components/data-table';

function App() {
	return (
		<div>
			<div className="h-full flex-1 flex-col space-y-8 p-8 flex">
				<div className="flex items-center justify-between space-y-2">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">🎇 Kiribi</h2>
						<p className="text-muted-foreground">This is your jobs</p>
					</div>
				</div>
				<DataTable />
			</div>
		</div>
	);
}

export default App;
