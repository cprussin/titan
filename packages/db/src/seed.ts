import type { User } from "@titan/domain/profile";
import { catalog } from "@titan/programs/catalog";
import { getAthleteState, setAthleteState } from "./athlete-state";
import type { Db } from "./client";
import { upsertExercise } from "./exercises";
import { initialAthleteState } from "./initial-athlete-state";
import { upsertProgram, upsertProgramVersion } from "./program-versions";
import { upsertUser } from "./users";

/** The single self-hosted athlete. v1 is single-user; the id is fixed so the app
 *  and seed agree without an accounts table. */
const DEFAULT_USER: User = {
  createdAt: "2026-01-01T00:00:00.000Z",
  displayName: "Athlete",
  id: "default",
};

/** Fixed timestamp for the bundled seed writes so the seed stays deterministic
 *  and re-running it produces no spurious changes. */
const SEED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

/**
 * Sync the bundled catalog into the database and ensure the default athlete is
 * placed. Every write is an upsert, so this is safe to run on every server
 * start: newly added or edited bundled exercises and programs propagate, while
 * the athlete is only *placed* when they have no state yet (see
 * {@link initialAthleteState}), so re-running never rewinds progress.
 */
export const seed = async (db: Db): Promise<void> => {
  await Promise.all(
    catalog.exercises.map((exercise) => upsertExercise(db, exercise)),
  );
  await Promise.all(
    catalog.programs.flatMap((entry) => [
      upsertProgram(db, entry.program),
      upsertProgramVersion(db, entry.version),
    ]),
  );
  await upsertUser(db, DEFAULT_USER);

  const [firstProgram] = catalog.programs;
  const placement = initialAthleteState(
    await getAthleteState(db, DEFAULT_USER.id),
    firstProgram?.version.id,
    DEFAULT_USER.id,
    SEED_TIMESTAMP,
  );
  if (placement !== undefined) {
    await setAthleteState(db, placement);
  }
};
