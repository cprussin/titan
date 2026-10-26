import type { Db } from "@titan/db/client";
import { getConnection } from "@titan/db/external-connections";
import type { Modality } from "@titan/domain/movement";
import { exerciseModalities } from "./exercise-modalities";
import { exerciseNames } from "./exercise-names";

/** What the execution screen needs beyond the session itself: every exercise's
 *  name and modality, and whether Concept2 is connected (which gates the rowing
 *  hand-off). */
export type ExecutionContext = {
  concept2Connected: boolean;
  exerciseModalities: Record<string, Modality>;
  exerciseNames: Record<string, string>;
};

export const loadExecutionContext = async (
  db: Db,
  userId: string,
): Promise<ExecutionContext> => {
  const [names, modalities, connection] = await Promise.all([
    exerciseNames(db),
    exerciseModalities(db),
    getConnection(db, userId, "concept2"),
  ]);
  return {
    concept2Connected: connection !== undefined,
    exerciseModalities: Object.fromEntries(modalities),
    exerciseNames: Object.fromEntries(names),
  };
};
