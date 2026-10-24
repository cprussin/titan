import type { Exercise } from "@titan/domain/exercise";
import type { Program, ProgramVersion } from "@titan/domain/program";
import {
  athleticHealthFoundation,
  athleticHealthFoundationV1,
} from "./athletic-health-foundation";
import {
  athleticHypertrophy,
  athleticHypertrophyV1,
} from "./athletic-hypertrophy";
import { exercises } from "./exercises";
import {
  fatLossMaintenance,
  fatLossMaintenanceV1,
} from "./fat-loss-maintenance";
import { rowingPerformance, rowingPerformanceV1 } from "./rowing-performance";
import { strengthPower, strengthPowerV1 } from "./strength-power";

/** A program paired with the immutable version workouts are prescribed from. */
export type ProgramCatalog = {
  exercises: readonly Exercise[];
  programs: readonly { program: Program; version: ProgramVersion }[];
};

/** The complete set of shared exercises, the four initial programs, and
 *  Athletic Hypertrophy. Athletic Health Foundation stays first: a fresh athlete
 *  is placed in the first program. */
export const catalog: ProgramCatalog = {
  exercises,
  programs: [
    {
      program: athleticHealthFoundation,
      version: athleticHealthFoundationV1,
    },
    { program: rowingPerformance, version: rowingPerformanceV1 },
    { program: strengthPower, version: strengthPowerV1 },
    { program: fatLossMaintenance, version: fatLossMaintenanceV1 },
    { program: athleticHypertrophy, version: athleticHypertrophyV1 },
  ],
};
