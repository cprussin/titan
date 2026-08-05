import type { Db } from "./client";

/**
 * The full database schema. No ORM: each entity table carries a few indexed
 * query columns plus a `data` JSONB column holding the domain object. Every
 * statement is `IF NOT EXISTS`, so applying it repeatedly is safe.
 *
 * The DDL is embedded as a string (rather than read from a `.sql` file) so it
 * works identically under Bun (the CLI) and Node (the app's auto-initialization,
 * where no filesystem read of a bundled asset is available).
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id text PRIMARY KEY,
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
  id text PRIMARY KEY,
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS program_versions (
  id text PRIMARY KEY,
  program_id text NOT NULL,
  version integer NOT NULL,
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS athlete_state (
  user_id text PRIMARY KEY,
  program_version_id text NOT NULL,
  absolute_week integer NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  program_version_id text NOT NULL,
  scheduled_date text NOT NULL,
  status text NOT NULL,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS workout_sessions_user_date
  ON workout_sessions (user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS workout_sessions_user_status
  ON workout_sessions (user_id, status);

CREATE TABLE IF NOT EXISTS readiness_entries (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  date text NOT NULL,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS readiness_user_date
  ON readiness_entries (user_id, date);

CREATE TABLE IF NOT EXISTS adaptation_decisions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  workout_session_id text,
  created_at text NOT NULL,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS adaptation_decisions_user
  ON adaptation_decisions (user_id, created_at);

CREATE TABLE IF NOT EXISTS body_metrics (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  date text NOT NULL,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS body_metrics_user_date
  ON body_metrics (user_id, date);

CREATE TABLE IF NOT EXISTS personal_records (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  exercise_id text NOT NULL,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS personal_records_user_exercise
  ON personal_records (user_id, exercise_id);

CREATE TABLE IF NOT EXISTS external_connections (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  provider text NOT NULL,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS external_connections_user
  ON external_connections (user_id, provider);

CREATE TABLE IF NOT EXISTS external_workouts (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  connection_id text NOT NULL,
  provider text NOT NULL,
  external_id text NOT NULL,
  match_status text NOT NULL,
  data jsonb NOT NULL,
  UNIQUE (provider, external_id)
);
CREATE INDEX IF NOT EXISTS external_workouts_user
  ON external_workouts (user_id);
`;

/** Apply the schema. Uses simple-query mode so the multi-statement DDL runs in
 *  one round trip. */
export const applySchema = async (db: Db): Promise<void> => {
  await db.unsafe(SCHEMA_SQL).simple();
};
