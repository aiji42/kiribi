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
  timeout?: number
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
    - **The value cannot be set higher than the `max_retries` set in `[[queues.consumers]]` of Kiribi Worker's `wrangler.toml`.**
  - `firstDelay`(Optional): The delay seconds before the first processing. The default value is 0.
    - Due to the characteristics of the queue, please note that there may be a few seconds of delay even if set to 0.
  - `retryDelay`(Optional): The delay seconds before the next retry. The default value is 0.
    - If `number`, the delay is fixed every time.
    - If `{ exponential: true, base: number }`, the delay is increased exponentially every time. The delay is calculated as `base^retryCount`.
  - `timeout`(Optional): The timeout seconds for processing the job. The default value is 0 (no timeout).
    - If the job processing time exceeds the timeout, the job throws `KiribiTimeoutError` and is retried according to the `maxRetries` and `retryDelay`.

:::info
The default value of `maxRetries` and `timeout` can be set in the Kiribi Worker class.
```typescript
import { Kiribi } from 'kiribi'

export default class extends Kiribi {
  defaultMaxRetries = 1 // [!code highlight]
  defaultTimeout = 60 // [!code highlight]
}
```
:::

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
  perform(payload: any): any | Promise<any>;
}
```

- `payload`(Required): The payload of the job.
  - The payload is the same as the one passed to the `enqueue` method's second argument.
  - The payload can be any **json serializable** type.

If thrown an error in the `perform` method, the job is retried according to the `maxRetries` and `retryDelay` set in the `enqueue` method.

The return value of the `perform` is passed to the `onSuccess` method of `Kiribi`.


## Hooks on failure and success

You can add hooks to Kiribi Worker to execute a function when a job fails or succeeds.

```typescript
import { Kiribi, SuccessHandlerMeta, FailureHandlerMeta } from 'kiribi'

export default class extends Kiribi {
  async onSucces(binding: string, payload: any, result: any, meta: SuccessHandlerMeta) {
    // Do something when the job succeeds
    console.log('onSuccess', binding, payload, result, meta)
  }

  async onFailure(binding: string, payload: any, error: any, meta: FailureHandlerMeta) {
    // Do something when the job fails
    console.log('onFailure', binding, payload, error, meta)
  }
}
```

### `onSuccess` method

The `onSuccess` method has the following signature:

```typescript
interface KiribiSuccessHandler {
  onSuccess(binding: string, payload: any, result: any, meta: SuccessHandlerMeta): void | Promise<void>;
}

interface SuccessHandlerMeta {
  startedAt: Date;
  finishedAt: Date;
  attempts: number;
}
```

- `binding`: The name of the job worker.
- `payload`: The payload of the job.
- `result`: The result of the job. The result is the return value of the `perform` method.
- `meta`: The metadata of the job.
  - `startedAt`: The time the job started.
  - `finishedAt`: The time the job finished.
  - `attempts`: The number of attempts the job took to complete.

### `onFailure` method

The `onFailure` method has the following signature:

```typescript
interface KiribiFailureHandler {
  onFailure(binding: string, payload: any, error: any, meta: FailureHandlerMeta): void | Promise<void>;
}

interface FailureHandlerMeta {
  startedAt: Date;
  finishedAt: Date;
  attempts: number;
  isFinal: boolean
}
```

- `binding`: The name of the job worker.
- `payload`: The payload of the job.
- `error`: The error of the job. The error is the error thrown in the `perform` method.
- `meta`: The metadata of the job.
  - `startedAt`: The time the job started.
  - `finishedAt`: The time the job finished.
  - `attempts`: The number of attempts the job took to complete.
  - `isFinal`: Whether the job has reached the maximum number of retries.

`onFailure` is called when the job fails, and `isFinal` is `true` when the job has reached the maximum number of retries.

## Tips

### Automatically complete the input of `enqueue` by type

You can complete the input of `enqueue` by passing the object of `KiribiPerformer` to the generic of `Kiribi`.

```typescript
import { Kiribi } from 'kiribi'
import { KiribiPerformer } from 'kiribi/performer'

type Performers = {
  MY_JOB: KiribiPerformer<{ key1: string; key2: number }>
}

interface Env {
  KIRIBI: Service<Kiribi<Performers>>
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    // The arguments of `enqueue` are automatically completed by the type of `MY_JOB`.
    await env.KIRIBI.enqueue('MY_JOB', { key1: 'value', key2: 1 }) // [!code highlight]

    // This is type error (key2 is not a number)
    // await env.KIRIBI.enqueue('MY_JOB', { key1: 'value', key2: '1' }) // [!code highlight]

    return new Response('OK')
  }
}
```

If you have a class that extends `KiribiPerformer` in the same project, you can complete the type more easily.

```typescript
import { KiribiPerformer } from 'kiribi/perfomer'

export class MyJob extends KiribiPerformer {
  async perform(payload: { key1: string; key2: number }) {
    // Do something with the payload
    console.log('perform', payload)
  }
}
```

```typescript
import { Kiribi } from 'kiribi'
import { MyJob } from './my-job'

interface Env {
  // You can complete the type from the argument of the performer
  KIRIBI: Service<Kiribi<{ 'MY_JOB': MyJob }>>
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    // The arguments of `enqueue` are automatically completed by the type of `MY_JOB`.
    await env.KIRIBI.enqueue('MY_JOB', { key1: 'value', key2: 1 }) // [!code highlight]

    return new Response('OK')
  }
}
```

### Sweep old jobs

You can sweep jobs by calling the `sweep` method of `Kiribi` with Cloudflare Worker's [cron trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/).

```typescript
import { Kiribi } from 'kiribi'

export default class extends Kiribi {
  async scheduled() {
    // Sweep jobs older than 1 week with statuses COMPLETED, CANCELLED
    await this.sweep() // [!code highlight]

    // Sweep jobs older than 2 weeks with status FAILED
    await this.sweep({ olderThan: 1000 * 60 * 60 * 24 * 14, statuses: ['FAILED'] }) // [!code highlight]

    // Sweep all jobs older than 1 month
    await this.sweep({ olderThan: 1000 * 60 * 60 * 24 * 30, statuses: '*' }) // [!code highlight]
  }
}
```

```toml
# wrangler.toml
name = "my-kiribi"
# ...

# Schedule the sweep job every day at 0:00
[triggers]
crons = [ "0 0 * * *" ]
```

### Recover jobs when the queue is unstable

Cloudflare Queue occasionally becomes unstable, and jobs may be lost. In such cases, you can re-enqueue the job by calling the `recover` method of `Kiribi`.

Use in conjunction with the [cron trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/).

```typescript
import { Kiribi } from 'kiribi'

export default class extends Kiribi {
  async scheduled() {
    await this.recover() // [!code highlight]
  }
}
```

```toml
# wrangler.toml
name = "my-kiribi"
# ...

# Schedule the recover job every 5 minutes
[triggers]
crons = [ "*/5 * * * *" ]
```

:::info
When using a combination of cron triggers with different frequencies:

```typescript
import { Kiribi } from 'kiribi'

export default class extends Kiribi {
  async scheduled({ cron }) {
    if (cron === '0 0 * * *') await this.sweep() // [!code highlight]

    if (cron === '*/5 * * * *') await this.recover() // [!code highlight]
  }
}
```
:::
