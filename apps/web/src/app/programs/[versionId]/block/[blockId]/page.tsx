import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import type { SelectedVariant } from "@titan/program-engine/variant";
import Link from "next/link";
import { notFound } from "next/navigation";
import { css } from "../../../../../../styled-system/css";
import { hstack, vstack } from "../../../../../../styled-system/patterns";
import { requireAuth } from "../../../../../auth/session";
import { Badge } from "../../../../../components/Badge";
import { PrescriptionTarget } from "../../../../../components/PrescriptionTarget";
import { db } from "../../../../../db";
import { roleTone } from "../../../../../role-tone";
import { exerciseNames } from "../../../../../server/exercise-names";
import type {
  BlockContext,
  ScheduledWorkout,
} from "../../../../../server/program-explorer";
import {
  blockSchedule,
  findBlockContext,
  sessionRotations,
} from "../../../../../server/program-explorer";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const BlockPage = async ({
  params,
}: {
  params: Promise<{ blockId: string; versionId: string }>;
}) => {
  await requireAuth();
  const { blockId, versionId } = await params;
  const [programs, versions, names] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
    exerciseNames(db),
  ]);
  const context = findBlockContext(programs, versions, versionId, blockId);
  if (context === undefined) {
    notFound();
  } else {
    return renderBlock(context, names);
  }
};

export default BlockPage;

const renderBlock = (context: BlockContext, names: Map<string, string>) => {
  const { block, program, version } = context;
  const schedule = blockSchedule(version, block);
  return (
    <div className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}>
      <div className={vstack({ alignItems: "stretch", gap: 1.5 })}>
        <Link className={backLinkStyles} href="/programs">
          ← {program.name}
        </Link>
        <h1 className={titleStyles}>{block.name}</h1>
        <p className={metaStyles}>{describeCadence(block)}</p>
      </div>
      <div className={scheduleStyles}>
        {schedule.map((workout) => renderWorkout(workout, names))}
      </div>
    </div>
  );
};

const renderWorkout = (
  workout: ScheduledWorkout,
  names: Map<string, string>,
) => {
  const { dayOfWeek, template } = workout;
  const rotations = sessionRotations(template);
  // More than one rotation means the workout swaps week to week (Week A / B /
  // …); each rotation gets its own labeled column so the alternatives read as
  // distinct choices rather than one long run of exercises.
  const rotatesByWeek = rotations.length > 1;
  return (
    <section className={workoutStyles} key={`${dayOfWeek}-${template.id}`}>
      <div className={workoutHeaderStyles}>
        <div className={vstack({ alignItems: "flex-start", gap: 0.5 })}>
          <span className={dayStyles}>{dayName(dayOfWeek)}</span>
          <h2 className={workoutNameStyles}>{template.name}</h2>
        </div>
        <span className={durationStyles}>{template.targetDurationMin} min</span>
      </div>
      {rotatesByWeek ? (
        <div className={variantsStyles}>
          <p className={variantsHintStyles}>
            Rotates by week — one option runs each week.
          </p>
          <div className={variantsGridStyles}>
            {rotations.map((rotation, index) =>
              renderVariant(rotation, index, names),
            )}
          </div>
        </div>
      ) : (
        <ul className={slotListStyles}>
          {rotations
            .flatMap((rotation) => rotation.slots)
            .map((slot) => renderSlot(slot, names))}
        </ul>
      )}
    </section>
  );
};

/** One week-variant of a rotating workout: a labeled column over its own slot
 *  list, set apart so Week A vs Week B is obvious at a glance. */
const renderVariant = (
  rotation: SelectedVariant,
  index: number,
  names: Map<string, string>,
) => (
  <div className={variantStyles} key={rotation.label ?? index}>
    <span className={variantLabelStyles}>{rotation.label}</span>
    <ul className={variantSlotListStyles}>
      {rotation.slots.map((slot) => renderSlot(slot, names))}
    </ul>
  </div>
);

/** One exercise row: name and target on the start edge, role badge on the end. */
const renderSlot = (
  slot: SelectedVariant["slots"][number],
  names: Map<string, string>,
) => (
  <li className={rowStyles} key={slot.id}>
    <div className={vstack({ alignItems: "flex-start", gap: 0.5 })}>
      <span className={exerciseNameStyles}>
        {names.get(slot.exerciseId) ?? slot.exerciseId}
      </span>
      <PrescriptionTarget prescription={slot.base} />
    </div>
    <Badge tone={roleTone(slot.role)}>{slot.role}</Badge>
  </li>
);

/** A block's length and deload cadence, for the header subtitle. */
const describeCadence = (block: TrainingBlock): string => {
  const weeks = `${block.durationWeeks} week${block.durationWeeks === 1 ? "" : "s"}`;
  return block.deloadEveryWeeks === undefined
    ? weeks
    : `${weeks} · deload every ${block.deloadEveryWeeks} weeks`;
};

/** The display name for an ISO weekday (1=Mon…7=Sun). Throws on an
 *  out-of-range day, which the program model forbids. */
const dayName = (dayOfWeek: number): string => {
  const name = DAY_NAMES[dayOfWeek - 1];
  if (name === undefined) {
    throw new Error(`invalid ISO weekday ${dayOfWeek}`);
  } else {
    return name;
  }
};

const backLinkStyles = css({
  color: "accent",
  fontSize: "sm",
  fontWeight: "medium",
});

const titleStyles = css({
  fontSize: "3xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lg: { fontSize: "4xl" },
});

const metaStyles = css({
  color: "muted",
  fontSize: "sm",
  fontWeight: "medium",
});

// Full-width workouts stacked down the page — on large screens each workout
// spreads its own exercise list into columns rather than sitting beside another
// workout, which read awkwardly when their lengths differed.
const scheduleStyles = vstack({
  alignItems: "stretch",
  gap: 8,
  lg: { gap: 12 },
});

// Each workout is a flat section, not a card: a ruled header over its exercises.
const workoutStyles = vstack({ alignItems: "stretch", gap: 3 });

// The exercise list flows into two columns on large screens so a full-width
// workout uses the room. Rows are separated by spacing, not rules — the only
// divider in a workout is the one under its header.
const slotListStyles = css({
  columnGap: 10,
  display: "grid",
  gridTemplateColumns: { base: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
  rowGap: 3,
});

const workoutHeaderStyles = hstack({
  borderBlockEnd: "1px solid {colors.border}",
  justifyContent: "space-between",
  paddingBlockEnd: 2,
});

const dayStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const workoutNameStyles = css({
  fontSize: "lg",
  fontWeight: "semibold",
  lg: { fontSize: "xl" },
});

const durationStyles = css({
  color: "textTertiary",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
});

// The week-variant block: a labeled column of its own exercises.
const variantsStyles = vstack({ alignItems: "stretch", gap: 3 });

const variantsHintStyles = css({
  color: "muted",
  fontSize: "sm",
});

// Variants sit side by side on wider screens and stack on phones, each a
// self-contained column so the alternatives never blur together.
const variantsGridStyles = css({
  columnGap: 6,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
  rowGap: 6,
});

const variantStyles = vstack({ alignItems: "stretch", gap: 3 });

// The variant's week label heads its column with an accent-ruled underline.
const variantLabelStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 45%, {colors.border})",
  color: "accent",
  fontSize: "sm",
  fontWeight: "semibold",
  letterSpacing: "wide",
  paddingBlockEnd: 1.5,
  textTransform: "uppercase",
});

const variantSlotListStyles = vstack({ alignItems: "stretch", gap: 3 });

const rowStyles = hstack({
  gap: 3,
  justifyContent: "space-between",
});

const exerciseNameStyles = css({ fontWeight: "medium" });
