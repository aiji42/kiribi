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

## Create Migration File

In `./main` directory.

```bash
npx prisma migrate diff --from-local-d1 --to-schema-datamodel=./schema.prisma --script -o ./migrations/__INPUT_NEW_MIGRATION_FILE_NAME__.sql
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
