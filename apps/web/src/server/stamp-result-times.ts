import type { ExerciseResult } from "@titan/domain/result";

/**
 * Give each result its wall-clock position in the session. A result already
 * saved on a prior write keeps the time it was first stamped; a newly logged one
 * takes `now`. Results round-trip through the client without their recorded time,
 * so it is matched back by id from what was previously stored rather than trusted
 * off the request. Order and payload are otherwise untouched.
 */
export const stampResultTimes = (
  stored: readonly ExerciseResult[],
  incoming: readonly ExerciseResult[],
  now: string,
): ExerciseResult[] => {
  const priorById = new Map(
    stored.map((result) => [result.id, result.recordedAt]),
  );
  return incoming.map((result) => ({
    ...result,
    recordedAt: result.recordedAt ?? priorById.get(result.id) ?? now,
  }));
};
