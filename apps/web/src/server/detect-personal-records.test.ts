import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { detectPersonalRecords } from "./detect-personal-records";

const sessionWith = (weightLb: number, reps: number): WorkoutSession => ({
  blockId: "b",
  dayOfWeek: 1,
  estimatedDurationMin: 60,
  id: "session-1",
  prescribedExercises: [],
  programVersionId: "pv",
  results: [
    {
      exerciseId: "back-squat",
      id: "res-1",
      prescription: Prescription.Strength({ reps, sets: 1, weightLb }),
      sets: [{ completed: true, reps, setIndex: 0, weightLb }],
      slotId: "squat",
    },
  ],
  scheduledDate: "2026-01-05",
  sessionTemplateId: "heavy-lower",
  status: "completed",
  userId: "default",
  weekNumber: 1,
});

const ids = () => {
  let n = 0;
  return () => {
    n += 1;
    return `pr-${n}`;
  };
};

describe("detectPersonalRecords", () => {
  it("records a PR when the estimated 1RM beats the prior best", () => {
    const prs = detectPersonalRecords({
      achievedAt: "2026-01-05T12:00:00.000Z",
      newId: ids(),
      priorBestByExercise: new Map([["back-squat", 250]]),
      session: sessionWith(245, 5), // est 1RM ≈ 285.8 > 250
    });
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({
      exerciseId: "back-squat",
      kind: "estimated-1rm",
    });
  });

  it("does not record when below the prior best", () => {
    const prs = detectPersonalRecords({
      achievedAt: "2026-01-05T12:00:00.000Z",
      newId: ids(),
      priorBestByExercise: new Map([["back-squat", 400]]),
      session: sessionWith(225, 5),
    });
    expect(prs).toHaveLength(0);
  });

  it("records a first-ever result as a PR", () => {
    const prs = detectPersonalRecords({
      achievedAt: "2026-01-05T12:00:00.000Z",
      newId: ids(),
      priorBestByExercise: new Map(),
      session: sessionWith(135, 5),
    });
    expect(prs).toHaveLength(1);
  });
});
