## Initialize

Create a new Queue:
```bash
npx wrangler queues create kiribi-queue
```
You can name the queue whatever you want.

Create a new d1 database:
```bash
npx wrangler d1 create kiribi-db
```
You can name the database whatever you want.
Copy the `database_id` that is displayed.

Update `wrangler.toml` with the following:

```toml
name = "your-worker-name"
compatibility_date = "2024-04-03"
main = "src/index.ts"

[[d1_databases]]
binding = "KIRIBI_DB" # Be sure to set KIRIBI_DB for the d1 database binding
database_name = "kiribi-db" # The name of the d1 database you created
database_id = "40fc2a53-40b6-4a74-b713-d5190e17477f" # The database_id of the d1 database you created
migrations_dir = './node_modules/kiribi/migrations'

[[queues.producers]]
binding = "KIRIBI_QUEUE" # Be sure to set KIRIBI_QUEUE for the queue binding
queue = "kiribi-queue" # The name of the queue you created

[[queues.consumers]]
queue = "kiribi-queue" # The name of the queue you created
max_retries = 5 # The number of retries cannot be set higher than this value. Please set it with some margin.

[[services]]
binding = "KIRIBI" # Be sure to set KIRIBI for the service binding
service = "your-worker-name"

[site]
bucket = "./node_modules/kiribi/client" # If you want to deploy the client, please set it
```

Migrate the database:
```bash
# local
npx wrangler d1 migrations apply kiribi-db --local
```

```bash
# remote
npx wrangler d1 migrations apply kiribi-db --remote
```

Update worker code in `src/index.ts`:
```typescript
import { Kiribi } from 'kiribi'
import client from 'kiribi/client'
import rest from 'kiribi/rest'

export default class extends Kiribi {
  // if you want to use the client, you can set it here
  client = client
  rest = rest
}
```

### Create Job Worker

You can create a separate Worker from kiribi, or you can add it to the kiribi Worker.

```typescript
// src/index.ts
import { KiribiJobWorker } from 'kiribi/job-worker'

export default class extends KiribiJobWorker {
  async perform(payload) {
    // Do something with the payload
    console.log('Job Worker', payload)
  }
}
```

Add the following to kiribi Worker's `wrangler.toml`:
```toml
[[services]]
binding = "EXAMPLE_JOB" # You can name the binding whatever you want
service = "your-job-worker" # The name of the job worker
entrypoint = "ExpotedClassName" # If you are exporting the KiribiJobWorker class, specify the name (not required for default export)
```


## Development

### Apply Migration

```bash
# local
npx wrangler d1 migrations apply kiribi-db --local
```

```bash
# remote
npx wrangler d1 migrations apply kiribi-db --remote
```

### Create Migration File

First, update `./prisma/schema.prisma` with the new schema.

Confirm the local d1 database is latest before execute the following command.

```bash
npx prisma migrate diff --from-local-d1 --to-schema-datamodel=./prisma/schema.prisma --script -o ./migrations/__INPUT_NEW_MIGRATION_FILE_NAME__.sql
```
