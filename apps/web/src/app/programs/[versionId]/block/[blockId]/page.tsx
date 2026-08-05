import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import type { SelectedVariant } from "@titan/program-engine/variant";
import { notFound } from "next/navigation";
import { css } from "../../../../../../styled-system/css";
import { hstack, vstack } from "../../../../../../styled-system/patterns";
import { requireAuth } from "../../../../../auth/session";
import { PrescriptionTarget } from "../../../../../components/PrescriptionTarget";
import { TopBar } from "../../../../../components/TopBar";
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
import { Accordion, Badge } from "../../../../../ui";

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
  // Built once, presented two ways: a single-open accordion on phones and every
  // day expanded at once on desktop. The two are toggled by CSS (not a media-
  // query hook), so there's no hydration flash and desktop keeps its overview.
  const days = schedule.map((workout) => ({
    content: renderWorkoutContent(workout, names),
    trigger: (
      <span className={dayTriggerStyles}>
        <span className={dayHeadingStyles}>
          <span className={dayLabelStyles}>{dayName(workout.dayOfWeek)}</span>
          <span className={dayNameStyles}>{workout.template.name}</span>
        </span>
        <span className={durationStyles}>
          {workout.template.targetDurationMin} min
        </span>
      </span>
    ),
    value: `${workout.dayOfWeek}-${workout.template.id}`,
  }));
  return (
    <div className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}>
      <TopBar
        breadcrumbs={[{ href: "/programs", label: program.name }]}
        description={describeCadence(block)}
        icon={<BarbellIcon size={18} />}
        title={block.name}
      />
      <div className={accordionOnlyStyles}>
        <Accordion items={days} />
      </div>
      <div className={overviewOnlyStyles}>
        {days.map((day) => (
          <section className={overviewDayStyles} key={day.value}>
            <div className={overviewHeaderStyles}>{day.trigger}</div>
            <div className={overviewBodyStyles}>{day.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
};

/** A workout's exercises — either a week-rotating set of labeled columns or a
 *  single two-column list. The day header/collapse is the accordion's job. */
const renderWorkoutContent = (
  workout: ScheduledWorkout,
  names: Map<string, string>,
) => {
  const rotations = sessionRotations(workout.template);
  // More than one rotation means the workout swaps week to week (Week A / B /
  // …); each rotation gets its own labeled column so the alternatives read as
  // distinct choices rather than one long run of exercises.
  const rotatesByWeek = rotations.length > 1;
  return rotatesByWeek ? (
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

// The collapsible accordion is the phone presentation; the always-expanded
// overview is the desktop one. Each is hidden at the other's breakpoint.
const accordionOnlyStyles = css({ lg: { display: "none" } });

const overviewOnlyStyles = css({
  display: "none",
  lg: { display: "flex", flexDirection: "column", gap: 12 },
});

const overviewDayStyles = css({ display: "flex", flexDirection: "column" });

// The desktop day header mirrors the accordion trigger's row but as a static,
// ruled heading (no caret, no toggle) since every day is already open.
const overviewHeaderStyles = css({
  borderBlockEnd: "1px solid {colors.border}",
  paddingBlockEnd: 2,
});

const overviewBodyStyles = css({ paddingBlockStart: 3 });

// The accordion trigger's content: the day label and workout name on the start
// edge, the duration on the end (the accordion supplies the caret after it).
const dayTriggerStyles = css({
  alignItems: "center",
  display: "flex",
  gap: 3,
  inlineSize: "100%",
  justifyContent: "space-between",
});

const dayHeadingStyles = css({
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  minInlineSize: 0,
});

const dayLabelStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const dayNameStyles = css({
  fontSize: "lg",
  fontWeight: "semibold",
  lg: { fontSize: "xl" },
});

const durationStyles = css({
  color: "textTertiary",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
});

// The exercise list flows into two columns on large screens so a full-width
// workout uses the room. Rows are separated by spacing, not rules — the only
// divider in a workout is the one under its header.
const slotListStyles = css({
  columnGap: 10,
  display: "grid",
  gridTemplateColumns: { base: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
  rowGap: 3,
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
