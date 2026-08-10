import type { Db } from "@titan/db/client";
import { getProgramVersion } from "@titan/db/program-versions";
import type { ExerciseSlot, SessionTemplate } from "@titan/domain/program";
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { NextAdaptation } from "@titan/program-engine/next-adaptations";
import { projectNextAdaptations } from "@titan/program-engine/next-adaptations";
import { buildSlotHistory, historyLookup } from "./slot-history";

/**
 * What the engine will do to each exercise the next time it's trained, computed
 * from every result through `session`. `session` must be completed and
 * persisted so its results are already part of the athlete's history; the
 * projection then runs each trained slot's progression policy against that
 * updated history. Empty when the program version or template behind the session
 * can no longer be found.
 */
export const nextSessionAdaptations = async (
  db: Db,
  session: WorkoutSession,
): Promise<readonly NextAdaptation[]> => {
  const programVersion = await getProgramVersion(db, session.programVersionId);
  // A missing version means the program is no longer placed — nothing to
  // project, matching how the day resolver treats an unresolved version.
  if (programVersion === undefined) {
    return [];
  } else {
    const template = programVersion.sessionTemplates.find(
      (entry) => entry.id === session.sessionTemplateId,
    );
    // A version that exists but lacks the session's own template is a data
    // integrity violation, not a benign empty state — surface it.
    if (template === undefined) {
      throw new Error(
        `session template ${session.sessionTemplateId} missing from program version ${programVersion.id}`,
      );
    } else {
      const slotsById = templateSlotsById(template);
      const slots = session.prescribedExercises.flatMap((exercise) => {
        const slot = slotsById.get(exercise.slotId);
        return slot === undefined ? [] : [slot];
      });
      const history = await buildSlotHistory(db, session.userId);
      return projectNextAdaptations(slots, historyLookup(history));
    }
  }
};

/** Index a template's slots by id across both its fixed `slots` and every
 *  variant's `slots` (exactly one is populated), so a session's slot ids resolve
 *  to their base prescription regardless of the template's shape. */
const templateSlotsById = (
  template: SessionTemplate,
): Map<string, ExerciseSlot> =>
  new Map(
    [
      ...(template.slots ?? []),
      ...(template.variants ?? []).flatMap((variant) => variant.slots),
    ].map((slot) => [slot.id, slot]),
  );
