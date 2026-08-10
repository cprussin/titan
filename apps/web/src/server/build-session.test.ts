import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { buildSession } from "./build-session";

const prescribed: PrescribedExercise = {
  exerciseId: "back-squat",
  prescription: Prescription.Strength({ reps: 5, sets: 5, weight: 230 }),
  progression: ProgressionPolicy.None(),
  role: "primary",
  slotId: "squat",
};

const idSequence = () => {
  const ids = ["session-1", "decision-1", "decision-2"];
  let index = 0;
  return () => {
    const id = ids[index] ?? `extra-${index}`;
    index += 1;
    return id;
  };
};

describe("buildSession", () => {
  it("assembles an in-progress session with linked adaptation decisions", () => {
    const { session, decisions } = buildSession({
      blockId: "foundation",
      createdAt: "2026-01-05T12:00:00.000Z",
      dayOfWeek: 1,
      decisions: [
        {
          action: "increase-load",
          details: { fromLb: 225, toLb: 230 },
          exerciseId: "back-squat",
          explanation: "Increase from 225 lb to 230 lb.",
          slotId: "squat",
        },
      ],
      estimatedDurationMin: 60,
      newId: idSequence(),
      prescribedExercises: [prescribed],
      programVersionId: "pv-1",
      readinessId: undefined,
      scheduledDate: "2026-01-05",
      sessionTemplateId: "heavy-lower",
      userId: "default",
      variantLabel: undefined,
      weekNumber: 2,
    });

    expect(session.id).toBe("session-1");
    expect(session.status).toBe("in-progress");
    expect(session.weekNumber).toBe(2);
    expect(session.results).toEqual([]);
    expect(session).not.toHaveProperty("readinessId");
    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.workoutSessionId).toBe("session-1");
    expect(decisions[0]?.layer).toBe("exercise");
    expect(session.adaptationDecisionIds).toEqual([decisions[0]?.id ?? ""]);
  });

  it("carries readiness and variant label when provided", () => {
    const { session } = buildSession({
      blockId: "foundation",
      createdAt: "2026-01-06T12:00:00.000Z",
      dayOfWeek: 2,
      decisions: [],
      estimatedDurationMin: 50,
      newId: idSequence(),
      prescribedExercises: [prescribed],
      programVersionId: "pv-1",
      readinessId: "readiness-9",
      scheduledDate: "2026-01-06",
      sessionTemplateId: "row-intervals",
      userId: "default",
      variantLabel: "Week A",
      weekNumber: 2,
    });
    expect(session.readinessId).toBe("readiness-9");
    expect(session.variantLabel).toBe("Week A");
  });
});
