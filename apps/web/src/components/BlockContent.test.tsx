import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Prescription } from "@titan/domain/prescription";
import type {
  ExerciseSlot,
  Program,
  ProgramVersion,
  SessionTemplate,
  TrainingBlock,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { BlockData } from "./BlockContent";
import { BlockContent } from "./BlockContent";
import { NavDrawerProvider } from "./NavDrawer";

const slot = (exerciseId: string): ExerciseSlot => ({
  base: Prescription.Strength({ reps: 5, sets: 3, weight: 100 }),
  exerciseId,
  generateWarmup: false,
  id: `slot-${exerciseId}`,
  progression: ProgressionPolicy.None(),
  role: "primary",
});

const template = (
  id: string,
  rest: Pick<SessionTemplate, "slots" | "variants">,
): SessionTemplate => ({
  constraints: {},
  id,
  name: `Session ${id}`,
  tags: [],
  targetDurationMin: 60,
  ...rest,
});

const program: Program = {
  description: "",
  goals: [],
  id: "program-1",
  name: "Titan",
};

/** A block's view data, built from the session templates its (sole) week runs —
 *  one day per template, Monday onward — so a test only states the exercises it
 *  cares about. */
const blockData = (
  templates: readonly SessionTemplate[],
  weekStructure: "progression" | "repeating",
): BlockData => {
  const block: TrainingBlock = {
    durationWeeks: 2,
    id: "block-1",
    name: "Base",
    weekStructure,
    weekTemplate: {
      days: templates.map((entry, index) => ({
        dayOfWeek: index + 1,
        sessionTemplateId: entry.id,
      })),
    },
  };
  const version: ProgramVersion = {
    blocks: [block],
    createdAt: "2024-01-01T00:00:00.000Z",
    id: "version-1",
    programId: program.id,
    sessionTemplates: [...templates],
    version: 1,
  };
  return {
    active: false,
    context: { block, program, version },
    names: new Map(
      templates
        .flatMap((entry) => [
          ...(entry.slots ?? []),
          ...(entry.variants ?? []).flatMap((variant) => variant.slots),
        ])
        .map((entry) => [entry.exerciseId, exerciseName(entry.exerciseId)]),
    ),
  };
};

const exerciseName = (exerciseId: string): string => `The ${exerciseId}`;

const router = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

const renderBlock = (data: BlockData) =>
  render(
    <AppRouterContext.Provider value={router}>
      <NavDrawerProvider>
        <BlockContent load={{ isLoading: false, value: data }} />
      </NavDrawerProvider>
    </AppRouterContext.Provider>,
  );

/** Every distinct ordinal shown by the rows naming `exerciseId`, `undefined`
 *  standing for a row that shows none. A fixed schedule renders each row twice
 *  — once for the phone accordion, once for the desktop overview — so
 *  consistent numbering collapses to a single entry. */
const ordinals = (exerciseId: string): readonly (string | undefined)[] => [
  ...new Set(
    screen
      .getAllByRole("listitem")
      .filter((row) => row.textContent?.includes(exerciseName(exerciseId)))
      .map(leadingOrdinal),
  ),
];

/** The number a row leads with, or `undefined` when it leads with the exercise
 *  name instead. */
const leadingOrdinal = (row: HTMLElement): string | undefined =>
  /^\d+/.exec(row.textContent ?? "")?.[0];

describe(BlockContent, () => {
  it("stands in a representative schedule with skeletons while loading", () => {
    const { container } = render(
      <NavDrawerProvider>
        <BlockContent load={{ isLoading: true }} />
      </NavDrawerProvider>,
    );
    // The Programs breadcrumb holds; the block title and control are skeletons.
    expect(screen.getByRole("link", { name: "Programs" })).toBeDefined();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });

  it("numbers a workout's exercises in execution order, restarting each day", () => {
    renderBlock(
      blockData(
        [
          template("a", { slots: [slot("squat"), slot("bench"), slot("row")] }),
          template("b", { slots: [slot("chin"), slot("curl")] }),
        ],
        "repeating",
      ),
    );
    expect(ordinals("squat")).toEqual(["1"]);
    expect(ordinals("bench")).toEqual(["2"]);
    expect(ordinals("row")).toEqual(["3"]);
    expect(ordinals("chin")).toEqual(["1"]);
    expect(ordinals("curl")).toEqual(["2"]);
  });

  it("leaves a day's sole exercise unnumbered", () => {
    renderBlock(
      blockData([template("a", { slots: [slot("squat")] })], "repeating"),
    );
    expect(ordinals("squat")).toEqual([undefined]);
  });

  it("restarts numbering within each rotating variant", () => {
    renderBlock(
      blockData(
        [
          template("a", {
            variants: [
              { label: "Day A", slots: [slot("squat"), slot("bench")] },
              { label: "Day B", slots: [slot("clean"), slot("press")] },
            ],
          }),
        ],
        "repeating",
      ),
    );
    expect(ordinals("squat")).toEqual(["1"]);
    expect(ordinals("bench")).toEqual(["2"]);
    expect(ordinals("clean")).toEqual(["1"]);
    expect(ordinals("press")).toEqual(["2"]);
  });

  it("numbers each day's exercises within a week-sectioned block", () => {
    renderBlock(
      blockData(
        [template("a", { slots: [slot("squat"), slot("bench")] })],
        "progression",
      ),
    );
    expect(ordinals("squat")).toEqual(["1"]);
    expect(ordinals("bench")).toEqual(["2"]);
  });
});
