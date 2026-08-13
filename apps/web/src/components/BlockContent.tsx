import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { FlagCheckeredIcon } from "@phosphor-icons/react/dist/ssr/FlagCheckered";
import type { Program, ProgramVersion } from "@titan/domain/program";
import type { SelectedVariant } from "@titan/program-engine/variant";
import Link from "next/link";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import type { Loadable } from "../loadable";
import { roleTone } from "../role-tone";
import type {
  BlockContext,
  BlockOutcome,
  BlockWeek,
  ScheduledWorkout,
  WeekWorkout,
} from "../server/program-explorer";
import {
  BlockOutcomeKind,
  blockOutcome,
  blockSchedule,
  blockWeekSchedules,
  blockWeekSummary,
  sessionRotations,
  showsWeekSections,
  stripWeekPrefix,
} from "../server/program-explorer";
import { Accordion, Badge, Card, Skeleton } from "../ui";
import { PrescriptionTarget } from "./PrescriptionTarget";
import { SetActiveBlockButton } from "./SetActiveBlockButton";
import { TopBar } from "./TopBar";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type BlockData = {
  active: boolean;
  context: BlockContext;
  names: Map<string, string>;
};

type Props = {
  load: Loadable<BlockData>;
};

/** A program block's schedule and its loading fallback, sharing one tree: the
 *  block chrome (breadcrumbs, title, and the set-active control) over the
 *  week-by-week or day-by-day plan. While loading, the title and control stand
 *  in as skeletons and a representative day schedule fills the body until the
 *  block resolves. */
export const BlockContent = ({ load }: Props) => {
  if (load.isLoading) {
    return (
      <div className={pageStyles}>
        <TopBar
          actions={<Skeleton height="1.75rem" radius="md" width="6rem" />}
          breadcrumbs={[{ href: "/programs", label: "Programs" }]}
          icon={<BarbellIcon size={18} />}
          title={<Skeleton height="1rem" width="8rem" />}
        />
        <BlockScheduleSkeleton />
      </div>
    );
  }
  const { active, context } = load.value;
  const { block, program, version } = context;
  // A progression block (weeks fundamentally different) is shown week by week,
  // so Week 1 reads exactly as Week 1 runs; a repeating block keeps its single
  // day-by-day weekly schedule.
  const body = showsWeekSections(block) ? (
    renderWeeks(blockWeekSchedules(version, block), load.value.names)
  ) : (
    <FixedSchedule
      names={load.value.names}
      schedule={blockSchedule(version, block)}
    />
  );
  return (
    <div className={pageStyles}>
      <TopBar
        actions={
          <SetActiveBlockButton
            active={active}
            blockId={block.id}
            label="Set as active"
            size="sm"
            variant="accent"
            versionId={version.id}
          />
        }
        breadcrumbs={[
          { href: "/programs", label: "Programs" },
          { label: program.name },
        ]}
        icon={<BarbellIcon size={18} />}
        title={block.name}
      />
      {body}
      {renderOutcome(blockOutcome(version, block), program, version)}
    </div>
  );
};

/** A representative day schedule — ruled day headers over two-column slot lists
 *  — standing in while the block resolves. */
const BlockScheduleSkeleton = () => (
  <>
    {PLACEHOLDER_DAYS.map((day) => (
      <section className={weekDayStyles} key={day}>
        <div className={weekDayHeaderStyles}>
          <div className={dayHeadingStyles}>
            <Skeleton height="0.75rem" width="4rem" />
            <Skeleton height="1.25rem" width="10rem" />
          </div>
          <Skeleton height="0.875rem" width="3rem" />
        </div>
        <ul className={slotListStyles}>
          {PLACEHOLDER_SLOTS.map((slot) => (
            <li className={rowStyles} key={slot}>
              <div className={vstack({ alignItems: "flex-start", gap: 0.5 })}>
                <Skeleton height="1rem" width="9rem" />
                <Skeleton height="0.875rem" width="6rem" />
              </div>
              <Skeleton height="1.25rem" radius="full" width="4.5rem" />
            </li>
          ))}
        </ul>
      </section>
    ))}
  </>
);

/** The week-sectioned view: one accordion row per training week, the first open,
 *  each holding that week's concrete day-by-day plan. */
const renderWeeks = (
  weeks: readonly BlockWeek[],
  names: Map<string, string>,
) => (
  <Accordion
    defaultValue={weeks.slice(0, 1).map(weekValue)}
    items={weeks.map((week) => ({
      content: (
        <div className={weekDaysStyles}>
          {week.isDeload ? (
            <p className={deloadNoteStyles}>
              Deload week — the engine holds loads and trims volume ~40–50%.
            </p>
          ) : undefined}
          {week.workouts.map((workout) => renderWeekDay(workout, names))}
        </div>
      ),
      trigger: (
        <span className={weekTriggerStyles}>
          <span className={weekHeadingStyles}>
            <span className={weekLabelStyles}>Week {week.week}</span>
            <span className={weekSummaryStyles}>{blockWeekSummary(week)}</span>
          </span>
          {week.isDeload ? <Badge tone="warning">Deload</Badge> : undefined}
        </span>
      ),
      value: weekValue(week),
    }))}
    multiple
  />
);

/** One day within a week: its heading (weekday, session, the week's variant) and
 *  the exact exercises that run that week. */
const renderWeekDay = (workout: WeekWorkout, names: Map<string, string>) => (
  <section
    className={weekDayStyles}
    key={`${workout.dayOfWeek}-${workout.template.id}`}
  >
    <div className={weekDayHeaderStyles}>
      <span className={dayHeadingStyles}>
        <span className={dayLabelStyles}>{dayName(workout.dayOfWeek)}</span>
        <span className={dayNameStyles}>
          {workout.template.name}
          {workout.variant.label === undefined ? undefined : (
            <span className={variantTagStyles}>
              {stripWeekPrefix(workout.variant.label)}
            </span>
          )}
        </span>
      </span>
      <span className={durationStyles}>
        {workout.template.targetDurationMin} min
      </span>
    </div>
    <ul className={slotListStyles}>
      {workout.variant.slots.map((slot) => renderSlot(slot, names))}
    </ul>
  </section>
);

/** The end-of-block hand-off: the next block the athlete rolls into, or program
 *  completion. A repeating block just keeps cycling, so it shows nothing. */
const renderOutcome = (
  outcome: BlockOutcome,
  program: Program,
  version: ProgramVersion,
) => {
  switch (outcome.kind) {
    case BlockOutcomeKind.NextBlock: {
      return (
        <Card title="When this block ends">
          <Link
            className={outcomeLinkStyles}
            href={`/programs/${version.id}/block/${outcome.block.id}`}
          >
            <span className={outcomeTextStyles}>
              <span className={outcomeLeadStyles}>Rolls into</span>
              <span className={outcomeTargetStyles}>{outcome.block.name}</span>
              <span className={outcomeMetaStyles}>
                Week 1 — working loads carry forward from this block.
              </span>
            </span>
            <ArrowRightIcon className={outcomeArrowStyles} size={18} />
          </Link>
        </Card>
      );
    }
    case BlockOutcomeKind.ProgramComplete: {
      return (
        <Card title="When this block ends">
          <p className={outcomeCompleteStyles}>
            <FlagCheckeredIcon size={18} />
            <span>You'll have completed {program.name}.</span>
          </p>
        </Card>
      );
    }
    case BlockOutcomeKind.RepeatsIndefinitely: {
      return undefined;
    }
  }
};

/** The rotating desktop/phone day view for a block whose weeks are all alike. */
const FixedSchedule = ({
  names,
  schedule,
}: {
  names: Map<string, string>;
  schedule: readonly ScheduledWorkout[];
}) => {
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
    <>
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
    </>
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

const weekValue = (week: BlockWeek): string => `week-${week.week}`;

// Three days, four exercise slots each — a representative block schedule for the
// loading state.
const PLACEHOLDER_DAYS = [0, 1, 2];
const PLACEHOLDER_SLOTS = [0, 1, 2, 3];

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

// The week trigger: the week label + its one-line summary on the start edge, a
// deload badge (when present) on the end.
const weekTriggerStyles = css({
  alignItems: "center",
  display: "flex",
  gap: 3,
  inlineSize: "100%",
  justifyContent: "space-between",
});

const weekHeadingStyles = css({
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  minInlineSize: 0,
});

const weekLabelStyles = css({
  fontSize: "lg",
  fontWeight: "semibold",
  lg: { fontSize: "xl" },
});

const weekSummaryStyles = css({
  color: "textTertiary",
  fontSize: "sm",
  textAlign: "start",
});

const weekDaysStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 6,
});

const deloadNoteStyles = css({
  color: "muted",
  fontSize: "sm",
});

const weekDayStyles = css({ display: "flex", flexDirection: "column", gap: 3 });

// A day heading inside a week: ruled like the desktop overview header so days
// read as distinct blocks within the open week.
const weekDayHeaderStyles = css({
  alignItems: "center",
  borderBlockEnd: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
  paddingBlockEnd: 2,
});

// The variant label sits beside the session name as a muted, accent-tinted tag.
const variantTagStyles = css({
  color: "accent",
  fontSize: "sm",
  fontWeight: "medium",
  marginInlineStart: 2,
});

const outcomeLinkStyles = css({
  _hover: { color: "accent" },
  alignItems: "center",
  borderRadius: "md",
  color: "foreground",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
});

const outcomeTextStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  minInlineSize: 0,
});

const outcomeLeadStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const outcomeTargetStyles = css({ fontSize: "lg", fontWeight: "semibold" });

const outcomeMetaStyles = css({ color: "textTertiary", fontSize: "sm" });

const outcomeArrowStyles = css({ color: "muted", flexShrink: 0 });

const outcomeCompleteStyles = hstack({ color: "muted", gap: 2 });

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
