import { clearAthleteStateForProgram as defaultClearAthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import {
  deleteProgramWithVersions as defaultDeleteProgram,
  getProgram as defaultGetProgram,
  upsertProgram as defaultUpsertProgram,
} from "@titan/db/program-versions";
import { programHasWorkoutSessions as defaultProgramHasHistory } from "@titan/db/workout-sessions";

/**
 * Delete a program, always preserving the athlete's history. When any logged
 * workout references one of the program's versions, the program is tombstoned
 * so those workouts stay resolvable while it drops out of the explorer. When
 * nothing references it, the program and its versions are removed outright and
 * any active pointer at them is cleared. The db reads/writes and clock are
 * injected so the orchestration is unit-testable (see TESTING.md).
 */
export const deleteProgram = async (
  db: Db,
  programId: string,
  programHasHistory: typeof defaultProgramHasHistory = defaultProgramHasHistory,
  getProgram: typeof defaultGetProgram = defaultGetProgram,
  upsertProgram: typeof defaultUpsertProgram = defaultUpsertProgram,
  clearAthleteStateForProgram: typeof defaultClearAthleteState = defaultClearAthleteState,
  deleteProgramWithVersions: typeof defaultDeleteProgram = defaultDeleteProgram,
  now: () => string = () => new Date().toISOString(),
): Promise<void> => {
  if (await programHasHistory(db, programId)) {
    const program = await getProgram(db, programId);
    if (program === undefined) {
      throw new Error(`program ${programId} not found`);
    } else {
      await upsertProgram(db, { ...program, tombstonedAt: now() });
    }
  } else {
    await clearAthleteStateForProgram(db, programId);
    await deleteProgramWithVersions(db, programId);
  }
};
