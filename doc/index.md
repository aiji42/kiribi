# 🎇 Kiribi

A simple job management library consisting of the Cloudflare stack.

:::warning
This library is still in the experimental stage. Please use it at your own risk.
:::

## Motivation

Popular frameworks have representative job (task) management systems. For example, Ruby on Rails has Sidekiq, Django has Celery, etc.<br>
These systems are designed to be used in conjunction with the framework, and they are very powerful.

But what about the Cloudflare stack? I still feel that there is a gap in the job management system.<br>
Fortunately, Cloudflare has services such as Queue and D1. I thought that these services could fill this gap.

Cloudflare Workers has a feature called Service Binding (RPC). This allows you to create independent modules that can be shared among workers.<br>
For example, you can share functions such as web scraping, image processing, and AI among multiple applications.<br>
Kiribi functions as a job management gateway using this feature. Kiribi deployed in your Cloudflare account, you can easily run common modules from each application and manage the execution status.

## Features

- 🎱 Easily enqueue jobs.
- 💎 Semi-persisted queues by combining Queue and D1.
- 💉 Easily add workers that process queues.
- 🎛️ Easily control retries and delays for each queue.
- 🔮 Check the execution status of jobs in real time.
- 🕸️ REST API for job management.
- 🕹️ Job management client for real-time monitoring.

![Job Management Client](/client.png)

## Under the hood

![Overview](/overview.png)


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
