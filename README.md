## Apply Migration

```bash
# local
npx wrangler d1 migrations apply job-controller --local
```

```bash
# remote
npx wrangler d1 migrations apply job-controller --remote
```

## Create Migration File

First, update `./prisma/schema.prisma` with the new schema.

Confirm the local d1 database is latest before execute the following command.

```bash
npx prisma migrate diff --from-local-d1 --to-schema-datamodel=./prisma/schema.prisma --script -o ./migrations/__INPUT_NEW_MIGRATION_FILE_NAME__.sql
```
