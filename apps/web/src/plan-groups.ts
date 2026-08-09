import type { SlotRole } from "@titan/domain/program";

/** Fixed display order for the plan's role groups: the primary movement leads,
 *  accessories trail — mirroring how a session is built and shed. */
const ROLE_ORDER: readonly SlotRole[] = ["primary", "secondary", "accessory"];

export type RoleGroup<T> = {
  role: SlotRole;
  exercises: readonly T[];
};

/** Partition prescribed exercises into role groups in {@link ROLE_ORDER},
 *  preserving each exercise's original order within its role and dropping roles
 *  with no exercises. */
export const groupByRole = <T extends { role: SlotRole }>(
  exercises: readonly T[],
): readonly RoleGroup<T>[] =>
  ROLE_ORDER.map((role) => ({
    exercises: exercises.filter((exercise) => exercise.role === role),
    role,
  })).filter((group) => group.exercises.length > 0);
