# 🎇 Kiribi

A simple job management library consisting of the Cloudflare stack.

:::warning
This library is still in the experimental stage. Please use it at your own risk.
:::

## Overview

![Overview](/overview.png)

- Provides a service binding that allows you to easily enqueue queues from workers.
- Queues can be semi-persisted by combining Queue and D1.
- Workers that process queues can be easily added by following a dedicated interface.
- Easily control retries and delays for each queue.
- Provides a client that allows you to check the execution status of jobs in real time.

![Job Management Client](/client.png)

## Demo

[Demo client page](https://example-kiribi.aiji422990.workers.dev/)

You can check the execution status of the job in real time.

:::info
Every hour, the demo client page is reset to the initial state.
:::

### How to use the demo

Add your job by clicking the "+ Job" button.

![Add Job](/demo.png)

Select a job from the Binding.

Select `FLAKY_JOB` to randomly fail the job.<br>
Enter a JSON data representing the success rate (0~1) in `payload`.

```json
{ "chance": 0.5 }
```

![Flaky Job](/flaky-job-example.png)

Select `SLOW_JOB` to delay the job.<br>
Enter a JSON data representing the delay time (1000~15000) in `payload`.

```json
{ "delay": 10000 }
```

![Slow Job](/slow-job-example.png)
