# Android app

A native Android client, `apps/android`, at feature parity with `apps/web`,
plus two platform features: a daily weigh-in reminder and an ongoing workout
notification. Kotlin + Jetpack Compose, against the existing Next.js backend,
with offline logging. The web app stays fully supported.

Target: sideloaded APK on a Pixel 10 Pro Fold (Android 17). `minSdk` =
`targetSdk` = 37.

## Stack

| Concern | Choice |
|---|---|
| UI | Jetpack Compose, Material 3 components themed with Titan's tokens (not Material You) |
| State | `ViewModel` + `StateFlow`, Navigation Compose |
| DI | Manual constructor injection (no Hilt) — matches TESTING.md's DI-over-mocking |
| Network | OkHttp + kotlinx.serialization |
| Local store | Room (cache + outbox) |
| Background | `AlarmManager` (reminder), foreground service (workout), WorkManager (sync) |
| Auth | The web's Google flow in a Custom Tab, PKCE-bound, deep-linked back |
| Lint / test | ktlint + detekt; JUnit 5, Turbine, Compose UI tests |
| Build | Gradle (Kotlin DSL) wrapped by `package.json` scripts so `turbo test` runs it |

Kotlin/Compose over React Native: the reusable TS is the engines, which already
run server-side; `component-library` is web-only; both new features are deep
Android APIs.

## Backend: `/api/v1/*`

Web pages read the DB in server components, so the app needs JSON endpoints.
The APK and server deploy independently, so per DATA.md these are versioned.
Each view endpoint returns the same view model the matching page builds
(`dashboard-view.ts`, `week-ribbon-data.ts`, `logged-session-view.ts`, …).

| Endpoint | Feeds |
|---|---|
| `GET /api/v1/dashboard` | Today / dashboard |
| `GET /api/v1/week?offset=` | Week ribbon |
| `GET /api/v1/plan?days=7` | Offline prescription cache |
| `GET /api/v1/workouts/:id` | Session + execution context |
| `GET /api/v1/history` | History, trends |
| `GET /api/v1/programs`, `…/:versionId/blocks/:blockId` | Program explorer |
| `GET /api/v1/settings`, `GET /api/v1/workouts/:id/complete` | Settings, summary |
| `GET /api/v1/workout-action`, `GET /api/v1/session` | FAB action, token check |
| Existing mutations (`workouts`, `body-metrics`, `readiness`, …) | Re-mounted under `v1`, accepting `Authorization: Bearer` |

- **Auth:** `GET /api/v1/auth/app/start?challenge=` runs the web's Google flow
  with `state.origin = titan://auth` and the PKCE challenge as its nonce; the
  callback deep-links the handoff to `titan://auth?token=`; `POST
  /api/v1/auth/app/token {handoff, verifier}` returns a session token. No
  Android OAuth client to register. `getSession` accepts cookie or bearer.
- **Time zone:** the app sends the `tz` cookie the web already uses.
- **Kotlin models:** hand-written `@Serializable` classes mirroring the v1
  view models (`ignoreUnknownKeys`). Most view types are TS types, not Zod
  schemas, so there is nothing to generate from; v1 shapes only grow
  optional fields (DATA.md), and a breaking change ships as `v2`.
- **Idempotency:** the app mints ids (sessions, results, weigh-ins,
  readiness) and timestamps (`startedAt`, `recordedAt`); recording is
  idempotent per slot, a replayed finish reports `Completed`, and inserts
  upsert by id.

## Offline

The server stays the source of truth; the app is a cache + outbox.

- **Cache:** on every connect (and app foreground), fetch `plan?days=7` —
  each day's resolved prescription(s), alternatives included — plus dashboard,
  history, and settings, into Room.
- **Start offline:** session id is a client UUID; `POST /workouts` accepts it
  and is idempotent (an in-progress session for the day wins; the app adopts
  its id). The server re-resolves the plan on sync; each result carries the
  prescription snapshot the athlete actually worked, so the log stays true.
- **Outbox:** every mutation (sets, recorded exercises, finish, weigh-ins,
  readiness) is appended to a Room outbox and replayed in order by a WorkManager
  job constrained to `CONNECTED`. The UI reads local state first.
- **Conflicts:** a `409 SessionClosed` on replay (finished/cancelled elsewhere)
  pauses that session's outbox and shows a conflict prompt: discard the phone's
  log, or view the server's. Other sessions' entries keep flowing.
- **After sync:** refetch the cache — adaptations from synced results change
  later prescriptions.

## Daily weigh-in reminder

- Exact alarm (`setExactAndAllowWhileIdle`, `SCHEDULE_EXACT_ALARM`) at the
  configured time; default 07:00 local. Re-armed on fire, boot
  (`BOOT_COMPLETED`), time/timezone change, and settings change.
- On fire: skip if a weigh-in exists for today (local Room, including the
  outbox — works offline). Else post a notification with a **Weigh in** action
  deep-linking to the weigh-in dialog.
- Settings: enable toggle + time picker, stored in DataStore
  (`reminder:v1`). Device-local, not synced.

## Workout notification

A foreground service (`specialUse` type) runs while a session is in
progress and owns the single active timer — rest countdown, effort timer, or
workout elapsed — so timing survives backgrounding and process death.

- Ongoing notification, promoted as a Live Update: exercise, set N of M,
  progress bar, and the timer via the system chronometer (no per-second
  updates).
- Action buttons mirror `WorkoutActionBar` for the current state (End Rest,
  Reset, …), dispatched to the same `ViewModel` intents as the screen.
- Audio: the 10-second countdown ticks and end-of-rest chime from
  `rest-alarm.ts`, ported to `AudioTrack`/`SoundPool` on the alarm stream,
  played by the service in the background. Same frequencies and cadence.
- Tapping the notification opens the active workout.

## Foldable layouts

Window size classes drive layout; no device checks.

| Width class | Folded (compact) | Unfolded (medium/expanded) |
|---|---|---|
| Navigation | Bottom bar | Navigation rail |
| Workout | Logger only | Prescription list + logger side by side |
| History / programs | List → detail | List-detail pane |

State survives fold/unfold (configuration change) via `ViewModel`.
Compose previews for both sizes; screenshot tests per size.

## Design system

Port `component-library`'s Panda tokens (colors, type scale, spacing, radii)
and the Barlow / Barlow Condensed fonts to a Compose theme (`TitanTheme`).
Tokens are generated from the Panda preset at build time so the two can't
drift. Phosphor icons: the SVGs `@phosphor-icons/react` ships, converted to vector
drawables at build time.

## Plan

- [ ] scaffold `apps/android` (Gradle, ktlint, detekt, turbo scripts, CI job)
- [ ] `TitanTheme` generated from the Panda preset
- [ ] Kotlin wire models
- [x] app sign-in + bearer-token auth
- [x] `/api/v1` view endpoints + client ids/timestamps + idempotent finish
- [ ] sign-in + dashboard + week
- [ ] Room cache + outbox + sync worker + conflict prompt
- [ ] workout execution (strength, cardio, Concept2, rest/effort timers)
- [ ] workout foreground service + notification + background audio
- [ ] weigh-in, readiness, history, trends
- [ ] programs explorer, settings
- [ ] daily weigh-in reminder
- [ ] foldable layouts audit
- [ ] signed release APK attached to a GitHub Release
