# @titan/db

Postgres persistence for Titan. **No ORM** — every query is a `postgres.js`
tagged template literal, which parameterizes interpolated values so query text
and user data never mix (the spec's "do not use an ORM … safe postgres client
with built-in query sanitization").

## Storage model

Each entity table carries a few indexed query columns (`id`, `user_id`,
`scheduled_date`, `status`, …) plus a `data jsonb` column holding the full
domain object. On read, the repository parses `data` with the entity's
`@titan/domain` Zod schema (see [`docs/guidelines/DATA.md`](../../docs/guidelines/DATA.md)) —
the database boundary is where untrusted bytes become typed domain objects.

The schema lives in [`src/schema.ts`](src/schema.ts) (embedded SQL). The app
calls [`initializeIfEmpty`](src/initialize.ts) on startup to apply it and seed
the bundled programs when the database is empty, so no manual migration step is
required in production.

## Usage

```ts
import { createDb } from "@titan/db/client";
import { getWorkoutSession } from "@titan/db/workout-sessions";

const db = createDb(connectionString);
const session = await getWorkoutSession(db, id);
```

`createDb` takes the connection string as an argument — the package reads no
environment itself. Only the CLI scripts read `DATABASE_URL` (via `Bun.env`).

## Scripts

```sh
bun run --filter @titan/db migrate   # apply schema.sql (idempotent)
bun run --filter @titan/db seed      # load bundled exercises + programs
```

Both require `DATABASE_URL` in the environment.

## Testing

`bun test` covers the pure row-parsing boundary (`parse-rows.ts`). The
repositories themselves are thin SQL glue over `postgres.js`; exercising their
SQL requires a live Postgres and belongs in integration tests, which are not
part of the default unit run.
