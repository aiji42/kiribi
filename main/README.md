# 🎇 Kirini

A simple job management library consisting of the Cloudflare stack.

See documentation at [kiribi.pages.dev](https://kiribi.pages.dev/).

## Getting Started

```bash
npm install -D prisma
npm install kiribi
```

```bash
$ npx wrangler d1 create kiribi-db
$ npx wrangler queues create kiribi-queue
```

```typescript
// src/index.ts
import { Kiribi } from 'kiribi'
import { client } from 'kiribi/client'
import { rest } from 'kiribi/rest'

export default class extends Kiribi {
  client = client
  rest = rest
}

import { KiribiJobWorker } from 'kiribi/worker'

export class MyJobWorker extends KiribiJobWorker {
  async perform(payload) {
    console.log('Job Worker', payload)
  }
}
```

```toml
# wrangler.toml
name = "my-kiribi"
compatibility_date = "2024-04-03"
main = "src/index.ts"

[[d1_databases]]
binding = "KIRIBI_DB"
database_name = "kiribi-db"
database_id = "xxxxxxxxxxxxx"
migrations_dir = './node_modules/kiribi/migrations'

[[queues.producers]]
binding = "KIRIBI_QUEUE"
queue = "kiribi-queue"

[[queues.consumers]]
queue = "kiribi-queue"
max_retries = 5

[[services]]
binding = "KIRIBI"
service = "your-worker-name"

[site]
bucket = "./node_modules/kiribi/client"

[[services]]
binding = "MY_JOB"
service = "my-kiribi"
entrypoint = "MyJobWorker"
```

```bash
npx wrangler d1 migrations apply kiribi-db --remote
```

```bash
npx wrangler deploy
```

## Usage

```toml
# wrangler.toml
name = "enqueuer"
compatibility_date = "2024-04-03"
main = "src/index.ts"

[[services]]
binding = "KIRIBI"
service = "my-kiribi"
```

```typescript
// src/index.ts
import { Kiribi } from 'kiribi'

interface Env {
  KIRIBI: Service<Kiribi>
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    await env.KIRIBI.enqueue('MY_JOB', { key: 'value' }, { maxRetries: 5 })

    return new Response('OK')
  }
}
```

## Development

See [develop.md](https://github.com/aiji42/kiribi/blob/main/develop.md).

## License

See [LICENSE](https://github.com/aiji42/kiribi/blob/main/LICENSE.txt).
