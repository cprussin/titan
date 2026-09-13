import type {
  ExerciseSlot,
  SessionAlternative,
  SessionTemplate,
} from "@titan/domain/program";

/** A session's resolved slots for a given week, plus the label when the session
 *  rotates (Row Intervals Week A/B/C/D, Athletic Day Power/…) or offers the
 *  athlete a choice (Long Easy Cardio row/run/hike/bike). */
export type SelectedVariant = {
  label: string | undefined;
  slots: readonly ExerciseSlot[];
};

/**
 * Resolve which slots a session template prescribes for `weekInBlock` (1-based).
 * A session offering alternatives resolves to the one the athlete chose (the
 * first when they haven't chosen yet, so a preview still reads as a concrete
 * plan); a rotating template cycles its variants by week; a fixed template
 * returns its slots. A template with none of the three is a program-authoring
 * bug and throws.
 *
 * @param alternativeId - The alternative the athlete picked for this session,
 *   for a template that offers them.
 */
export const selectVariant = (
  template: SessionTemplate,
  weekInBlock: number,
  alternativeId?: string,
): SelectedVariant => {
  if (template.alternatives !== undefined && template.alternatives.length > 0) {
    return chooseAlternative(template, template.alternatives, alternativeId);
  } else if (alternativeId !== undefined) {
    throw new Error(
      `session template ${template.id} offers no alternatives, but ${alternativeId} was chosen`,
    );
  } else if (template.variants !== undefined && template.variants.length > 0) {
    const index = (weekInBlock - 1) % template.variants.length;
    const variant = template.variants[index];
    if (variant === undefined) {
      throw new Error(
        `variant index ${index} out of range for session ${template.id}`,
      );
    } else {
      return { label: variant.label, slots: variant.slots };
    }
  } else if (template.slots === undefined) {
    throw new Error(
      `session template ${template.id} has neither slots, variants, nor alternatives`,
    );
  } else {
    return { label: undefined, slots: template.slots };
  }
};

/** The alternative `alternativeId` names, or the first one when the athlete
 *  hasn't chosen. An id the session doesn't offer is a stale or forged choice,
 *  not a reason to silently fall back to another session's work. */
const chooseAlternative = (
  template: SessionTemplate,
  alternatives: readonly SessionAlternative[],
  alternativeId: string | undefined,
): SelectedVariant => {
  const chosen =
    alternativeId === undefined
      ? alternatives[0]
      : alternatives.find((entry) => entry.id === alternativeId);
  if (chosen === undefined) {
    throw new Error(
      `session template ${template.id} does not offer alternative ${alternativeId}`,
    );
  } else {
    return { label: chosen.label, slots: chosen.slots };
  }
};
