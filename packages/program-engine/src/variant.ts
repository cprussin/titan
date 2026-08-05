import type { ExerciseSlot, SessionTemplate } from "@titan/domain/program";

/** A session's resolved slots for a given week, plus the rotation label when the
 *  session rotates (Row Intervals Week A/B/C/D, Athletic Day Power/…). */
export type SelectedVariant = {
  label: string | undefined;
  slots: readonly ExerciseSlot[];
};

/**
 * Resolve which slots a session template prescribes for `weekInBlock` (1-based).
 * A rotating template cycles its variants by week; a fixed template returns its
 * slots. A template with neither is a program-authoring bug and throws.
 */
export const selectVariant = (
  template: SessionTemplate,
  weekInBlock: number,
): SelectedVariant => {
  if (template.variants !== undefined && template.variants.length > 0) {
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
      `session template ${template.id} has neither slots nor variants`,
    );
  } else {
    return { label: undefined, slots: template.slots };
  }
};
