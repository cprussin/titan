# Engine separation

Titan is a workout **execution engine**, not a workout logger. The whole
system is organized around one pipeline, and every stage is a distinct,
immutable artifact:

```
Program Definition  →  Workout Prescription  →  Workout Result  →  Adaptation Decision
   (programs/)          (program-engine)         (recorded)         (adaptation-engine)
```

## The rule

`@titan/program-engine` and `@titan/adaptation-engine` are **pure TypeScript**.
They import `@titan/domain` and nothing else — no React, no database client, no
`fetch`, no clock, no randomness that isn't passed in. Every input arrives as a
function argument; every output is a returned value. This is what makes them
exhaustively unit-testable and what makes every decision reproducible.

If an engine function needs "now", the caller passes the date. If it needs
history, the caller passes the history. The engines never reach out.

## Why each stage is immutable

- **Program Definition** — a program is *data* (`programs/`), versioned. Editing
  a program mints a new `ProgramVersion`; historical workouts keep referencing
  the version they were prescribed from. We never mutate a shipped version.
- **Workout Prescription** — what the engine says to do today, derived from the
  program version + the athlete's position + history. Stored with the session so
  the prescription is a permanent record, never recomputed after the fact.
- **Workout Result** — what actually happened: sets, reps, weights, RPE, cardio
  splits. Append-only.
- **Adaptation Decision** — why the next prescription changed. Every progression,
  deload, or session cut is stored as an `AdaptationDecision` carrying a
  human-readable `explanation`. Nothing adapts silently.

## What stays deterministic

Training loads, deload timing, progression, and safety decisions are **rules**,
never AI. AI (future) may summarize and explain trends, but it never decides a
load. See the spec's "AI Usage" section.

## Layering

```
domain  ←  program-engine
   ↑            ↑
   └──  adaptation-engine
   ↑
   └──  concept2 (normalization), db, component-library, apps/web
```

`domain` is the leaf everything shares. The two engines depend only on it and
are consumed by `apps/web` (and by tests). `db` persists the domain types;
`apps/web` composes all of it and owns the only I/O.
