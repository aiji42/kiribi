# Getting Started

## 1. Create a Job Manager (Kiribi worker)

<img src="/kiribi-worker.png" width="420px">

Use `create-cloudflare-cli` (C3) to build the base worker.<br>
You will be asked for the project name, so feel free to set it as you like.

```bash
npm create cloudflare@latest -- --ts --type=hello-world
```

Install `kiribi` and `prisma` in the directory of the created project.

```bash
npm install -D prisma
npm install kiribi prisma
```

Create a D1 database and a queue for Kiribi.<br>
You can set the database name and queue name as you like, but please copy the `database_id` displayed as it will be used in later steps.

```bash
npx wrangler d1 create kiribi-db
# copy the database_id
```

```bash
npx wrangler queues create kiribi-queue
```

Update `wrangler.toml` as follows:

```toml
name = "my-kiribi" # set the name of your worker freely
compatibility_date = "2024-04-03"
main = "src/index.ts"

[[d1_databases]]
binding = "KIRIBI_DB" # Be sure to set KIRIBI_DB for the d1 database binding
database_name = "kiribi-db" # The name of the d1 database you created
database_id = "xxxxxxxxxxxxxxxx" # The database_id of the d1 database you created
migrations_dir = './node_modules/kiribi/migrations'

[[queues.producers]]
binding = "KIRIBI_QUEUE" # Be sure to set KIRIBI_QUEUE for the queue binding
queue = "kiribi-queue" # The name of the queue you created

[[queues.consumers]]
queue = "kiribi-queue" # The name of the queue you created
max_retries = 5

[[services]]
binding = "KIRIBI" # Be sure to set KIRIBI for the service binding
service = "my-kiribi" # same as `name`
```

::: info
`max_retries` is a hard limit for the job retry setting. Please set it with some margin.<br>
For example, if `max_retries` is 5, the number of retries will be 4.
:::

Migrate the database.

If you want to run it locally:

```bash
npx wrangler d1 migrations apply kiribi-db --local
```

If you want to run it remotely:

```bash
npx wrangler d1 migrations apply kiribi-db --remote
```

Update the worker code in `src/index.ts`.

```typescript
import { Kiribi } from 'kiribi'

export default class extends Kiribi {}
```

Deploy the worker.

```bash
npx wrangler deploy
```

:::info
If you deploy the worker for the first time, you may encounter an error like the following.

```
✘ [ERROR] A request to the Cloudflare API (/accounts/xxxxxxxxx/workers/scripts/my-kiribi) failed.

  workers.api.error.service_binding_error: could not resolve binding "KIRIBI": script
  "my-kiribi" not found [code: 10143]
```
If you encounter this error, comment out `[[services]]` in `wrangler.toml`, deploy, and then uncomment and deploy again.

```toml
[[services]]                                                        // [!code --]
binding = "KIRIBI" # Be sure to set KIRIBI for the service binding  // [!code --]
service = "my-kiribi"                                               // [!code --]
# [[services]]                                                      // [!code ++]
# binding = "KIRIBI"                                                // [!code ++]
# service = "my-kiribi"                                             // [!code ++]
```
:::

## 2. Create job processing workers

<img src="/processing-workers.png" width="420px">

Create a worker to process jobs enqueued in Kiribi.<br>
You can add this worker to the Kiribi worker created in the previous step, or you can create it as a separate worker.<br>

### Case of adding to the Kiribi worker

Add the following to `src/index.ts`.

```typescript
import { Kiribi } from 'kiribi'
import { KiribiWorker } from 'kiribi/worker' // [!code ++]

export default class extends Kiribi {}

export class MyJobWorker extends KiribiWorker { // [!code ++]
  async perform(payload) {                      // [!code ++]
    // Do something with the payload            // [!code ++]
    console.log('Job Worker', payload)          // [!code ++]
  }                                             // [!code ++]
}                                               // [!code ++]
```

For more information on `perform`, click [here](/how-to-use).

Add the following to `wrangler.toml`.

```toml
name = "my-kiribi"
compatibility_date = "2024-04-03"
main = "src/index.ts"

# ...Omitted...

[[services]]
binding = "KIRIBI"
service = "my-kiribi"

[[services]]                                                    // [!code ++]
binding = "MY_JOB" # You can name the binding whatever you want // [!code ++]
service = "my-job-worker" # same as `name`                      // [!code ++]
entrypoint = "MyJobWorker" # the name of exported class         // [!code ++]
```

### Case of creating a separate worker

If you want to separate the processing system from the Kiribi worker, do the following.<br>
The method of creating a worker is omitted.

Update the `src/index.ts` of the other worker as follows.

```typescript
import { KiribiWorker } from 'kiribi/worker'

// There must be at least one default export
export default class extends KiribiWorker {
  async perform(payload) {
    // Do something with the payload
    console.log('Job Worker', payload)
  }
}

// Add other workers as needed
export class FooJobWorker extends KiribiWorker {
  async perform(payload) {
    // Do something with the payload
    console.log('Job Worker', payload)
  }
}
```

Add the following to the `wrangler.toml` of the Kiribi worker.

```toml
name = "my-kiribi"
compatibility_date = "2024-04-03"
main = "src/index.ts"

# ...Omitted...

[[services]]
binding = "KIRIBI"
service = "my-kiribi"

[[services]]                                                    // [!code ++]
binding = "MY_JOB" # You can name the binding whatever you want // [!code ++]
service = "other-job-worker" # The name of the job worker       // [!code ++]
                                                                // [!code ++]
[[services]]                                                    // [!code ++]
binding = "FOO_JOB"                                             // [!code ++]
service = "other-job-worker"                                    // [!code ++]
entrypoint = "FooJobWorker" # the name of exported class        // [!code ++]
```

Deploy the worker.

```bash
npx wrangler deploy
```

## 3. Create enqueuing workers

<img src="/enqueuing-worker.png" width="420px">

Create a worker to enqueue jobs in Kiribi.<br>
The method of creating a worker is omitted.

Update the `wrangler.toml` of the worker as follows.

```toml
name = "my-enqueuing-worker"
compatibility_date = "2024-04-03"
main = "src/index.ts"

[[services]]
binding = "KIRIBI" # Be sure to set KIRIBI for the service binding
service = "my-kiribi" # The name of the Kiribi worker
```


```typescript
import { Kiribi } from 'kiribi'

interface Env {
  KIRIBI: Service<Kiribi>
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    // Enqueue a job
    await env.KIRIBI.enqueue('MY_JOB', { key: 'value' })

    return new Response('OK')
  }
}
```

For more information on how to use it, click [here](/how-to-use).
