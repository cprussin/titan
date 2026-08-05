# Titan

An adaptive personal fitness coach — a self-hosted, mobile-first PWA that
actively **manages** a long-term training program rather than merely logging
workouts. It presents today's workout, guides you set by set, records execution
with minimal friction, and then **deterministically** decides your next
prescription — always with a plain-English explanation of every adaptation.

See the [product spec](docs/architecture/ENGINE_SEPARATION.md) for the
architecture and [`docs/`](docs/) for engineering guidelines.

## Prerequisites

- **[Bun](https://bun.sh) ≥ 1.3.14** — package manager, test runner, and script
  runner. Everything else (TypeScript, Next.js, Panda, Biome, Turbo, Storybook)
  is a workspace dependency installed via `bun install`.
- **[Node.js](https://nodejs.org) ≥ 24** — Next.js's build/runtime toolchain.
- **PostgreSQL** — any Postgres 14+ database. For hosted development,
  [Neon](https://neon.tech)'s free tier works out of the box (see
  [Deployment](#deployment)).

### Installing Bun

```sh
curl -fsSL https://bun.sh/install | bash   # macOS / Linux
```

Verify with `bun --version` (should print ≥ 1.3.14).

## Common tasks

Tasks are orchestrated by [Turborepo](https://turborepo.com). Run them through
`bun run turbo <task>`.

| Task | Command |
| --- | --- |
| Start the web app in dev mode | `bun run turbo start:dev --filter @titan/web` |
| Run the full test suite (types + unit + lint + deps) | `bun run turbo test` |
| Type-check only | `bun run turbo test:types` |
| Unit tests only | `bun run turbo test:unit` |
| Lint only | `bun run turbo test:lint` |
| Auto-fix lint & formatting | `bun run turbo fix` |
| Component-library Storybook | `bun run --filter @titan/component-library start:dev` |

### Running a task in a single workspace

```sh
bun run --filter @titan/program-engine test:unit
bun run --filter @titan/web test:types
```

## Running the app end-to-end

1. Provision a Postgres database and configure the app:

   ```sh
   cp apps/web/.env.example apps/web/.env.local
   # edit apps/web/.env.local: DATABASE_URL, AUTH_PASSWORD, AUTH_SESSION_SECRET, …
   ```

2. Start the app:

   ```sh
   bun run turbo start:dev --filter @titan/web
   ```

   Open http://localhost:3000, sign in with `AUTH_PASSWORD`, and start training.
   On first use the app **initializes the database automatically** — it applies
   the schema and seeds the bundled programs if the database is empty. (You can
   still run `bun run --filter @titan/db migrate` and `… seed` manually if you
   prefer to do it ahead of time.)

## Repo structure

```
apps/
  web/                  Next.js App Router PWA (the only I/O boundary)

packages/
  domain/               Pure domain model: types + Zod schemas. The shared leaf.
  program-engine/       Pure: ProgramVersion + position + history → Prescription.
  adaptation-engine/    Pure: progression, session, and weekly adaptation rules.
  concept2/             Concept2 OAuth2 client + workout normalization + matching.
  db/                   Postgres access via tagged-template SQL (no ORM).
  component-library/    Shared React UI primitives (Base UI + Panda CSS).
  test-support/         bun:test + Testing Library preload and helpers.

programs/               Versioned program definitions (data, not code).

docs/
  guidelines/           Compliance docs, indexed with authority levels by AGENTS.md.
  architecture/         Design docs (not guidelines).
```

The two engines are **pure TypeScript**: they depend only on `@titan/domain`
and are independent of React and the database. See
[ENGINE_SEPARATION.md](docs/architecture/ENGINE_SEPARATION.md).

## Deployment

Titan deploys to [Vercel](https://vercel.com) (web) + [Neon](https://neon.tech)
(Postgres), both of which have generous free tiers. Full step-by-step
instructions live in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Tooling notes

- **Linting & formatting**: [Biome](https://biomejs.dev) (`biome check`).
- **TypeScript**: extends `@cprussin/tsconfig`.
- **Styling**: [Panda CSS](https://panda-css.com); the shared preset and design
  tokens live in `@titan/component-library`.
- **Component primitives**: [Base UI](https://base-ui.com).
- **Dependencies**: pinned centrally in the root `package.json` `catalog` and
  referenced as `"catalog:"` from each workspace.
