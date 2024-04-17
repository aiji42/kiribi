# Job management client

You can use a web client to check the execution status of jobs.

![Job Management Client](/client.png)

Set the Kiribi client to the Kiribi Worker.

```typescript
// src/index.ts
import { Kiribi } from 'kiribi'
import { client } from 'kiribi/client' // [!code ++]
import { rest } from 'kiribi/rest'     // [!code ++]

export default class extends Kiribi {
  client = client                      // [!code ++]
  rest = rest                          // [!code ++]
}
```

```toml
# wrangler.toml
name = "my-kiribi"
compatibility_date = "2024-04-03"
main = "src/index.ts"

[site]                                  // [!code ++]
bucket = "./node_modules/kiribi/client" // [!code ++]
# ...Omited...
```

Deploy.

```bash
npx wrangler deploy
```

To use the Kiribi client, access the endpoint of the Kiribi Worker.

:::warning
The client is currently exposed globally. We recommend using Cloudflare Zero Trust to restrict access.
:::
