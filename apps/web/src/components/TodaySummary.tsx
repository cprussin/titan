import type { Program } from "@titan/domain/program";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { blockWeeks } from "../block-weeks";
import { groupByRole } from "../plan-groups";
import { programName } from "../program-name";
import type { Today } from "../server/today";
import type { WorkoutAction } from "../server/workout-action";
import { Badge, Card } from "../ui";
import { BlockProgress } from "./BlockProgress";
import { PrescriptionTarget } from "./PrescriptionTarget";
import { WorkoutActionControl } from "./WorkoutActionControl";

type Props = {
  /** Today's launch action, mirrored into the card as a convenience alongside
   *  the app-wide button. Absent on rest / no-program days. */
  action: WorkoutAction | undefined;
  names: Map<string, string>;
  programs: readonly Program[];
  today: Today;
};

/** The dashboard's lead card: where the athlete is right now and what to train.
 *  The program, block, and today's session name orient them; the prescribed
 *  plan grouped by role follows; a rest-day or no-program state stands in when
 *  there's nothing to lift. Launching the session lives in the app-wide
 *  {@link WorkoutActionButton}, not here. */
export const TodaySummary = ({ action, names, programs, today }: Props) => {
  switch (today.kind) {
    case "no-program": {
      return (
        <Intro title="No active program">
          Run <code>bun run --filter @titan/db seed</code> to load the bundled
          programs, then place one to see today&rsquo;s session here.
        </Intro>
      );
    }
    case "rest": {
      return (
        <Intro eyebrow="Today · Rest day" title="Recovery">
          Recover well — walk, stretch, foam roll, or take an easy row under 20
          minutes. No prescribed intensity today.
        </Intro>
      );
    }
    case "workout": {
      return (
        <Workout
          action={action}
          names={names}
          programs={programs}
          today={today}
        />
      );
    }
  }
};

type IntroProps = {
  children: ReactNode;
  eyebrow?: string | undefined;
  title: string;
};

const Intro = ({ children, eyebrow = "Today", title }: IntroProps) => (
  <Card>
    <div className={headerStyles}>
      <span className={eyebrowStyles}>{eyebrow}</span>
      <h2 className={titleStyles}>{title}</h2>
    </div>
    <p className={copyStyles}>{children}</p>
  </Card>
);

type WorkoutProps = {
  action: WorkoutAction | undefined;
  names: Map<string, string>;
  programs: readonly Program[];
  today: Extract<Today, { kind: "workout" }>;
};

const Workout = ({ action, names, programs, today }: WorkoutProps) => {
  const { block, isDeloadWeek, weekInBlock } = today.position;
  const groups = groupByRole(today.resolved.prescribedExercises);

  return (
    <Card>
      <div className={topStyles}>
        <div className={headerStyles}>
          <div className={eyebrowRowStyles}>
            <span className={eyebrowStyles}>
              Today · {programName(programs, today.programVersion.programId)}
            </span>
            {isDeloadWeek && <Badge tone="warning">Deload week</Badge>}
          </div>
          <h2 className={titleStyles}>{today.template.name}</h2>
          <p className={metaStyles}>
            {block.name} · Week {weekInBlock} of {block.durationWeeks} · ~
            {today.resolved.estimatedDurationMin} min
          </p>
          <BlockProgress weeks={blockWeeks(weekInBlock, block.durationWeeks)} />
        </div>

        {action !== undefined && (
          <div className={ctaStyles}>
            <WorkoutActionControl action={action} />
          </div>
        )}
      </div>

      <div className={planStyles}>
        {groups.map((group) => (
          <div className={groupStyles} key={group.role}>
            <h3 className={roleLabelStyles}>{group.role}</h3>
            <ul className={listStyles}>
              {group.exercises.map((exercise) => (
                <li className={rowStyles} key={exercise.slotId}>
                  <span className={nameStyles}>
                    {names.get(exercise.exerciseId) ?? exercise.exerciseId}
                  </span>
                  <PrescriptionTarget prescription={exercise.prescription} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
};

// The session header and its launch control stack on phones — the control
// full-width below the header — but on wide screens they share a row so the
// button floats to the trailing edge at its natural width instead of stretching
// across the whole card.
const topStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  lg: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
  },
});

const headerStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 1.5,
  lg: { flex: 1, minInlineSize: 0 },
});

// Hidden on phones, where the floating action button already sits right beside
// the content and this would only duplicate it. From `lg` up — where the FAB
// gives way to the sidebar button and the header has room to spare — it appears
// on the header's trailing edge at its natural width.
const ctaStyles = css({
  display: "none",
  lg: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
});

// The eyebrow and the deload badge share a row so the program label leads and
// the deload flag sits on the trailing edge.
const eyebrowRowStyles = hstack({
  gap: 3,
  justifyContent: "space-between",
});

const eyebrowStyles = css({
  color: "accent",
  fontSize: "xs",
  fontWeight: "bold",
  letterSpacing: "wide",
  minInlineSize: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

const titleStyles = css({
  fontFamily: "condensed",
  fontSize: "2xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lg: { fontSize: "3xl" },
  lineHeight: "condensed",
});

const metaStyles = css({ color: "muted", fontSize: "sm" });

const copyStyles = css({
  color: "muted",
  fontSize: "sm",
  maxInlineSize: "40rem",
});

// The plan is the focus: role groups stacked with clear headings, each a
// hairline-ruled list of exercise-over-target rows.
// A hairline rule separates the session header/action from the plan below it.
const planStyles = vstack({
  alignItems: "stretch",
  borderBlockStart: "1px solid {colors.border}",
  gap: 5,
  paddingBlockStart: 5,
});

const groupStyles = vstack({ alignItems: "stretch", gap: 0 });

const roleLabelStyles = css({
  color: "textTertiary",
  fontSize: "xs",
  fontWeight: "bold",
  letterSpacing: "wide",
  paddingBlockEnd: 1,
  textTransform: "uppercase",
});

const listStyles = css({
  display: "flex",
  flexDirection: "column",
  listStyleType: "none",
  margin: 0,
  padding: 0,
});

const rowStyles = hstack({
  _first: { borderBlockStart: "none" },
  alignItems: "baseline",
  borderBlockStart: "1px solid {colors.border}",
  gap: 4,
  justifyContent: "space-between",
  paddingBlock: 2.5,
});

const nameStyles = css({ fontWeight: "medium", minInlineSize: 0 });
