## Initialize

```bash
npx wrangler queues create kiribi-queue
```

```bash
npx wrangler d1 create kiribi-db
```

## Apply Migration

```bash
# local
npx wrangler d1 migrations apply kiribi-db --local -c packages/kiribi/wrangler.toml
```

```bash
# remote
npx wrangler d1 migrations apply kiribi-db --remote -c packages/kiribi/wrangler.toml
```

## Create Migration File

First, update `./prisma/schema.prisma` with the new schema.

Confirm the local d1 database is latest before execute the following command.

```bash
npx prisma migrate diff --from-local-d1 --to-schema-datamodel=./prisma/schema.prisma --script -o ./migrations/__INPUT_NEW_MIGRATION_FILE_NAME__.sql
```
