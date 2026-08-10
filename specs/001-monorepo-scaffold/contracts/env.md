# Contract: Environment Configuration

**Feature**: `001-monorepo-scaffold` | **Consumers**: `apps/api`, every future API feature,
every deployment target

This is a real contract, not documentation: `apps/api/src/config/env.ts` is the single place
`process.env` is read, and every other module receives configuration as a typed import from it.
Changing this contract changes what a deployment must provide.

## Shape

```ts
// apps/api/src/config/env.ts — exported shape
{
  NODE_ENV: 'development' | 'test' | 'production'
  PORT: number
  HOST: string
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  DATABASE_URL: string
  REDIS_URL: string
  S3_ENDPOINT: string
  S3_REGION: string
  S3_ACCESS_KEY_ID: string
  S3_SECRET_ACCESS_KEY: string
  S3_BUCKET: string
  CORS_ORIGINS: string[]   // parsed from a comma-separated string; never contains '*'
}
```

The exported object is frozen. Consumers import it; they do not read `process.env` themselves.

## Guarantees this contract makes

1. **Fully validated or the process is dead.** If the import succeeds, every field is present and
   well-typed. No consumer needs a null check, a fallback, or a `!` assertion.
2. **Failure happens before the port is bound.** No request is ever served by a process with
   invalid configuration.
3. **Failure names the variable, never the value.** Output is `<VARIABLE_NAME>: <constraint>`.
   A secret cannot leak into a terminal, a CI log, or a screen share through this path.
4. **All problems are reported at once.** A deployment missing four variables learns all four on
   the first attempt.
5. **`CORS_ORIGINS` can never be `*`.** Rejected by the schema, per Article 29.

## Local vs. production

Only `S3_ENDPOINT` differs in kind between environments. Cloudflare R2 is S3-compatible and MinIO
speaks the same protocol, so one variable set serves both — there is no local variant of the
storage configuration to drift from the production one.

| Variable | Local (`docker-compose`) | Production |
|---|---|---|
| `DATABASE_URL` | `postgresql://pascca:pascca@localhost:5432/pascca` | managed PostgreSQL 16 |
| `REDIS_URL` | `redis://localhost:6379` | managed Redis 7 |
| `S3_ENDPOINT` | `http://localhost:9000` (MinIO) | R2 S3 endpoint |
| `S3_REGION` | `auto` | `auto` |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | real origins, never `*` |

## Changing this contract

Adding a variable requires all three, in the same commit:

1. the field in the Zod schema,
2. the key in `.env.example` with a placeholder,
3. the row in this file.

The sync test (`apps/api/tests/env-example-sync.test.ts`) fails the build if 1 and 2 disagree, so
the contract cannot silently drift from what a deployment actually needs.

**Removing** a variable is a breaking change for every deployment target and must be called out in
the PR description. Note this schema validates only its own **declared** keys — it never rejects
`process.env` for carrying other, unrelated variables (ambient OS/CI variables are always
present) — so a deployment that still sets a since-removed variable will not itself fail; the
removal is a contract change to communicate, not a validation error to rely on.
