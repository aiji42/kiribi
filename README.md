# 🎇 Kiribi

A simple job management library consisting of the Cloudflare stack.

See documentation at [kiribi.pages.dev](https://kiribi.pages.dev/).

## TODOs

- documentations/examples
  - [ ] Update document for methods other than `enqueue` and `perform`.
    - [ ] `delete`
    - [ ] `cancel`
    - [ ] `find`
    - [ ] `findMany`
    - [ ] `count`
    - [ ] `sweep`
  - [ ] Update document for REST API
  - [ ] Create a logo, favicon, and feature image
  - [ ] Add example templates for `npx wrangler generate`
- tests/pipeline
  - [ ] Add tests for the library
  - [ ] Create pipeline for CI/CD
    - [ ] test
    - [ ] deploy example (demo page)
    - [ ] publish library
- features
  - [ ] Create a script for auto initialization of the database and queue
  - [ ] Re-enqueue for a case when Queue is unstable and data is volatile
    - [ ] Auto re-enqueue by cron trigger
    - [ ] Manual re-enqueue by REST API and client
  - [ ] Form validation for the client
  - [ ] Leave enqueue source information in the database
  - [ ] Directly call from enqueuer to performer via Kiribi without using Queue
  - [x] Hooks on failure and success
  - [x] Autocomplete by type of binding name and payload
