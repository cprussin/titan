# @titan/concept2

The Concept2 Logbook integration: authenticate a user's Logbook account over
OAuth2, pull their logged rowing workouts, normalize each into the
provider-neutral domain shape, and match an import to the planned session it
belongs to. It is a pure library — no database, no React — so every function is
deterministic and unit-testable.

## What it does

- **`oauth`** — a thin Concept2 OAuth2 client. `buildAuthorizeUrl` produces the
  consent URL; `exchangeCode` / `refreshToken` trade a code or refresh token for
  access tokens; `fetchResults` pulls logged workouts. Each network function
  takes an injected `fetch` (defaulting to the platform global) so tests inject a
  stub. All JSON is parsed with Zod at the boundary, and a non-OK HTTP response
  throws with the status attached.
- **`concept2-api`** — the Zod schemas for the Logbook API "result" payload and
  the results-list envelope. This is the single place the wire shape is
  validated; note Concept2 reports `time` in **tenths of a second** and often
  omits `heart_rate`.
- **`normalize`** — `normalizeWorkout(raw)` parses a raw result and maps it to
  the domain `NormalizedWorkout`: tenths-of-seconds become seconds, the per-500m
  split is derived via `@titan/domain/pace`, and heart-rate / stroke-rate carry
  through only when present.
- **`match`** — `matchWorkout(normalized, candidateSessions)` picks the planned
  rowing/cardio session scheduled for the day the piece was rowed (Concept2
  stamps the logbook in the athlete's local time and `scheduledDate` is that
  same local day). `matchSlot(prescription, scheduledDate, candidates)` runs the
  other direction for the live rowing step: which imported row is *this*
  prescribed effort — and when several rows hit the target (a warm-up and a
  cool-down rowed to the same prescription), it reports them all as an
  `Ambiguous` outcome for the caller to put to the athlete rather than guessing.
  Within the day the test is **exact**, because the
  prescription is what the athlete dials into the ergometer — a fixed-time piece
  runs the prescribed clock, a fixed-distance piece stops on the prescribed
  metre, and an interval piece logs the prescribed number of work intervals at
  the prescribed size, so a continuous 2 km is never 6 × 500 m. Only the axis
  the prescription pins down is tested; the distance a timed piece covers, the
  split, and the target heart-rate zone are not. The "no planned session" case
  is returned as a `MatchResult` variant, not thrown.

## Dependencies

- `@titan/domain` — the `NormalizedWorkout`, `CardioResult`, `IntervalResult`,
  and `WorkoutSession` types it maps to and matches against, plus the
  `splitSecPer500` pace math it reuses.
- `zod` — boundary parsing of every external payload.

## Usage

```ts
import { exchangeCode, fetchResults } from "@titan/concept2/oauth";
import { normalizeWorkout } from "@titan/concept2/normalize";
import { matchWorkout } from "@titan/concept2/match";

const token = await exchangeCode({ clientId, clientSecret, code, redirectUri });
const raw = await fetchResults({ accessToken: token.access_token, from });

for (const result of raw) {
  const normalized = normalizeWorkout(result);
  const match = matchWorkout(normalized, plannedSessions);
  // persist raw + normalized + match status
}
```

## Test

- `bun run --filter @titan/concept2 test:unit` — unit tests (`bun:test`).
- `bun run --filter @titan/concept2 test:types` — `tsc --noEmit` typecheck.
