import type { ExerciseSlot, SessionTemplate } from "@titan/domain/program";

/**
 * Index a template's slots by id across every shape it can take — its fixed
 * `slots`, each rotating variant's slots, and each user-selectable
 * alternative's slots (exactly one of the three is populated). A recorded
 * session references the slots of whichever rotation ran or alternative the
 * athlete chose, so all of them have to resolve back to their base
 * prescription.
 */
export const templateSlotsById = (
  template: SessionTemplate,
): Map<string, ExerciseSlot> =>
  new Map(
    [
      ...(template.slots ?? []),
      ...(template.variants ?? []).flatMap((variant) => variant.slots),
      ...(template.alternatives ?? []).flatMap(
        (alternative) => alternative.slots,
      ),
    ].map((slot) => [slot.id, slot]),
  );
