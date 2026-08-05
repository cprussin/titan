# Deploying Titan (Vercel + Neon, free tier)

Titan runs entirely on free tiers: **Vercel** hosts the Next.js PWA and its API
routes, **Neon** provides serverless Postgres, and **Concept2 Logbook** (optional)
supplies rowing/heart-rate data. Total cost: $0 for a single self-hosted athlete.

The deployable unit is `apps/web` (`@titan/web`). Build settings are committed
in [`apps/web/vercel.json`](../apps/web/vercel.json), and the database
**initializes itself** on first use — so deployment is just "point it at a
database and go."

## 1. Provision the database (Neon)

1. Create a free project at [neon.tech](https://neon.tech).
2. In **Connection Details**, copy the **pooled** connection string — the host
   contains `-pooler` — ending with `?sslmode=require`. The pooled endpoint is
   required because Vercel's serverless functions open many short-lived
   connections; the client is configured with `prepare: false` for pooler
   compatibility.

That's the only database step. On the app's first request it applies the schema
and, if the database is empty, seeds the four bundled programs and creates the
athlete at week 1 — no migrate/seed command to run.

## 2. Deploy the web app (Vercel)

1. Import your fork at [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory** to `apps/web`. Leave the build/install/output settings
   alone — `apps/web/vercel.json` already sets them (it runs
   `turbo build` from the repo root so the Panda CSS is generated before
   `next build`).
3. Add the **Environment Variables** (Production + Preview):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Neon **pooled** connection string from step 1 |
   | `AUTH_PASSWORD` | the password you'll sign in with |
   | `AUTH_SESSION_SECRET` | a long random string (`openssl rand -hex 32`) |

4. Deploy. Open the app, sign in with `AUTH_PASSWORD`, and start training. On
   iOS/Android, use the browser's **Add to Home Screen** to install the PWA.

See [`apps/web/.env.example`](../apps/web/.env.example) for the full variable
list, including the optional Concept2 keys.

## 3. Concept2 sync (optional)

1. Register an application in the
   [Concept2 Logbook developer settings](https://log.concept2.com/developers/keys)
   with the redirect URI `https://<your-app>.vercel.app/api/concept2/callback`.
2. Add `CONCEPT2_CLIENT_ID`, `CONCEPT2_CLIENT_SECRET`, and `CONCEPT2_REDIRECT_URI`
   to the Vercel environment and redeploy.
3. In the app's **Trends** screen, click **Connect Concept2**, authorize, then
   **Sync Concept2** to import rows. Imported workouts are auto-matched to
   planned rowing sessions by date.

## Notes

- **Auto-initialization.** On startup the app runs `initializeIfEmpty`
  (`@titan/db/initialize`): the schema is applied (`CREATE TABLE IF NOT EXISTS`,
  idempotent) and the programs are seeded only when the database has none. It
  runs once per server process. The schema lives in
  [`packages/db/src/schema.ts`](../packages/db/src/schema.ts).
- **Manual DB commands** are still available if you prefer to initialize ahead
  of the first request (e.g. against a local Postgres):
  ```sh
  export DATABASE_URL='postgres://…?sslmode=require'
  bun run --filter @titan/db migrate   # apply schema
  bun run --filter @titan/db seed       # load programs
  ```
- **No ORM.** Persistence is raw parameterized SQL via `postgres.js`
  (`@titan/db`).
- **Deterministic engine.** Every training decision comes from
  `@titan/program-engine` / `@titan/adaptation-engine` (pure TypeScript) and is
  stored with a plain-English explanation — no AI in the training loop.
- **Background work.** v1 needs none: adaptation runs when a workout is
  completed, and Concept2 import is on-demand. To automate imports later, add a
  [Vercel Cron](https://vercel.com/docs/cron-jobs) hitting a secret-guarded sync
  endpoint.
- **Self-hosting with Docker** (the spec's original target) also works — point
  `DATABASE_URL` at any Postgres 14+ and run `next start` behind a reverse
  proxy — but the Vercel + Neon path above is the fastest zero-cost option.
