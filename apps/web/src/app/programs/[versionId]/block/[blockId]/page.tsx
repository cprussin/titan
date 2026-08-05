import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import type { SelectedVariant } from "@titan/program-engine/variant";
import Link from "next/link";
import { notFound } from "next/navigation";
import { css } from "../../../../../../styled-system/css";
import { grid, hstack, vstack } from "../../../../../../styled-system/patterns";
import { requireAuth } from "../../../../../auth/session";
import { db } from "../../../../../db";
import { describePrescription } from "../../../../../prescription-text";
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
    <div className={vstack({ alignItems: "stretch", gap: 4 })}>
      <div className={vstack({ alignItems: "stretch", gap: 1 })}>
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
  return (
    <section className={cardStyles} key={`${dayOfWeek}-${template.id}`}>
      <div className={hstack({ justifyContent: "space-between" })}>
        <div className={vstack({ alignItems: "flex-start", gap: 0.5 })}>
          <span className={dayStyles}>{dayName(dayOfWeek)}</span>
          <h2 className={workoutNameStyles}>{template.name}</h2>
        </div>
        <span className={durationStyles}>{template.targetDurationMin} min</span>
      </div>
      {sessionRotations(template).map((rotation, index) =>
        renderRotation(rotation, index, names),
      )}
    </section>
  );
};

const renderRotation = (
  rotation: SelectedVariant,
  index: number,
  names: Map<string, string>,
) => (
  <div
    className={vstack({ alignItems: "stretch", gap: 2 })}
    key={rotation.label ?? index}
  >
    {rotation.label !== undefined && (
      <span className={rotationLabelStyles}>{rotation.label}</span>
    )}
    <ul className={vstack({ alignItems: "stretch", gap: 0 })}>
      {rotation.slots.map((slot) => (
        <li className={rowStyles} key={slot.id}>
          <div className={vstack({ alignItems: "flex-start", gap: 0.5 })}>
            <span className={exerciseNameStyles}>
              {names.get(slot.exerciseId) ?? slot.exerciseId}
            </span>
            <span className={targetStyles}>
              {describePrescription(slot.base)}
            </span>
          </div>
          <span className={rolePillStyles}>{slot.role}</span>
        </li>
      ))}
    </ul>
  </div>
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

const titleStyles = css({ fontSize: "3xl", fontWeight: "bold" });

const metaStyles = css({
  color: "muted",
  fontSize: "sm",
  fontWeight: "medium",
});

const scheduleStyles = grid({
  alignItems: "start",
  gap: 4,
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
});

const cardStyles = vstack({
  alignItems: "stretch",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "xl",
  gap: 3,
  padding: 4,
});

const dayStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  textTransform: "uppercase",
});

const workoutNameStyles = css({ fontSize: "lg", fontWeight: "semibold" });

const durationStyles = css({ color: "textTertiary", fontSize: "sm" });

const rotationLabelStyles = css({
  color: "accent",
  fontSize: "xs",
  fontWeight: "semibold",
  textTransform: "uppercase",
});

const rowStyles = hstack({
  _first: { borderBlockStart: "none", paddingBlockStart: 0 },
  borderBlockStart: "1px solid {colors.border}",
  justifyContent: "space-between",
  paddingBlock: 3,
});

const exerciseNameStyles = css({ fontWeight: "medium" });

const targetStyles = css({ color: "muted", fontSize: "sm" });

const rolePillStyles = css({
  backgroundColor: "color-mix(in oklab, {colors.foreground} 8%, transparent)",
  borderRadius: "full",
  color: "textTertiary",
  fontSize: "xs",
  paddingBlock: 0.5,
  paddingInline: 2,
});
