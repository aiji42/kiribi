# Development

```bash
yarn install
```

## Run dev server

```bash
yarn dev
```

## Apply Migration

In `./main` directory.

```bash
# local
npx wrangler d1 migrations apply kiribi-db --local
```

```bash
# remote
npx wrangler d1 migrations apply kiribi-db --remote
```

## Publish library

```bash
yarn workspace kiribi publish
```

## Deploy demo page

If first time you need to create queue and database
```bash
$ cd example
$ npx wrangler d1 create example-kiribi-db
$ npx wrangler queues create example-kiribi-queue
$ npx wrangler d1 migrations apply example-kiribi-db --remote
```

```bash
# in root directory
$ yarn workspace kiribi prepack
$ cd example
$ yarn wrangler deoply
```
