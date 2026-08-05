import { z } from "zod";

/**
 * Entity identifiers. Every persisted entity is keyed by an opaque string id
 * (UUID in the database, but the domain never depends on the format). The
 * aliases exist for readability at call sites — `ExerciseId` documents intent
 * where a bare `string` would not — and all resolve to `string`, so ids parse
 * and serialize with zero ceremony at the database and API boundaries.
 */
export const idSchema = z.string().min(1);

export type UserId = string;
export type EquipmentId = string;
export type ExerciseId = string;
export type ProgramId = string;
export type ProgramVersionId = string;
export type TrainingBlockId = string;
export type SessionTemplateId = string;
export type ExerciseSlotId = string;
export type WorkoutSessionId = string;
export type ExerciseResultId = string;
export type AdaptationDecisionId = string;
export type ReadinessEntryId = string;
export type BodyMetricId = string;
export type PersonalRecordId = string;
export type ExternalConnectionId = string;
export type ExternalWorkoutId = string;
