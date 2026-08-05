import type { AdaptationAction } from "@titan/domain/adaptation-decision";

/**
 * A session- or weekly-layer adaptation, minus the persistence fields (id,
 * user, timestamps) the app fills in when it writes the `AdaptationDecision`.
 * Unlike the exercise layer, these layers don't produce a single prescription,
 * so there is no `prescription` field.
 */
export type AdaptationNote = {
  action: AdaptationAction;
  details?: Record<string, number>;
  explanation: string;
};
