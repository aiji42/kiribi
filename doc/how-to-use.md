# How to use

## Enqueue Job

You can enqueue a job from enqueuer workers by calling the `enqueue` method of `KIRIBI` service.

```typescript
import { Kiribi } from 'kiribi'

interface Env {
  KIRIBI: Service<Kiribi>
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    // Enqueue a job
    await env.KIRIBI.enqueue('MY_JOB', { key: 'value' }, { maxRetries: 5 }) // [!code highlight]

    return new Response('OK')
  }
}
```

### `enqueue` method

The `enqueue` method has the following signature:

```typescript
type enqueue = (binding: string, payload: any, options?: EnqueueOptions) => Promise<void>

type EnqueueOptions = {
  maxRetries?: number
  firstDelay?: number
  retryDelay?: number | { exponential: boolean; base: number }
}
```

- `binding`(Required): The name of the job worker.
  - The name of the job worker is set in Kiribi Worker's `wrangler.toml`.
- `payload`(Required): The payload of the job.
  - The payload can be any type.
  - The payload is passed to the `perform` method of the job worker.
- `options`(Optional): The options for enqueuing the job.
  - `maxRetries`(Optional): The maximum number of retries when the job fails. The default value is 3.
    - The job is retried one less than the number of `maxRetries` when it fails. (e.g., If `maxRetries` is 5, the job is retried 4 times.)
    - The value cannot be set higher than the `max_retries` set in `[[queues.consumers]]` of Kiribi Worker's `wrangler.toml`.
  - `firstDelay`(Optional): The delay seconds before the first processing. The default value is 0.
    - Due to the characteristics of the queue, please note that there may be a few seconds of delay even if set to 0.
  - `retryDelay`(Optional): The delay seconds before the next retry. The default value is 0.
    - If `number`, the delay is fixed every time.
    - If `{ exponential: true, base: number }`, the delay is increased exponentially every time. The delay is calculated as `base^retryCount`.

## Perform Job

You can create job processing workers by extending `KiribiPerformer` and implementing the `perform` method.

```typescript
import { KiribiPerformer } from 'kiribi/performer'

export default class extends KiribiPerformer {
  async perform(payload) {
    // Do something with the payload
    console.log('perform', payload)
  }
}
```

### `perform` method

The `perform` method has the following signature:

```typescript
interface KiribiPerformer extends WorkerEntrypoint {
  perform(payload: any): void | Promise<void>;
}
```

- `payload`(Required): The payload of the job.
  - The payload is the same as the one passed to the `enqueue` method.
  - The payload can be any **json serializable** type.

If thrown an error in the `perform` method, the job is retried according to the `maxRetries` and `retryDelay` set in the `enqueue` method.
