import type { User } from "@titan/domain/profile";
import { catalog } from "@titan/programs/catalog";
import { getAthleteState, setAthleteState } from "./athlete-state";
import type { Db } from "./client";
import { upsertExercise } from "./exercises";
import { upsertProgram, upsertProgramVersion } from "./program-versions";
import { upsertUser } from "./users";

/** The single self-hosted athlete. v1 is single-user; the id is fixed so the app
 *  and seed agree without an accounts table. */
const DEFAULT_USER: User = {
  createdAt: "2026-01-01T00:00:00.000Z",
  displayName: "Athlete",
  id: "default",
};

/**
 * Seed the bundled exercises and programs, and ensure the default athlete exists
 * and is placed at week 1 of the first program (only if they have no state yet,
 * so re-seeding never rewinds progress). Idempotent — every write is an upsert.
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
  const existingState = await getAthleteState(db, DEFAULT_USER.id);
  if (existingState === undefined && firstProgram !== undefined) {
    await setAthleteState(db, {
      absoluteWeek: 1,
      programVersionId: firstProgram.version.id,
      updatedAt: "2026-01-01T00:00:00.000Z",
      userId: DEFAULT_USER.id,
    });
  }
};
