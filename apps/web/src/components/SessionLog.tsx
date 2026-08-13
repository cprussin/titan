import type { ExerciseResult } from "@titan/domain/result";
import { css } from "../../styled-system/css";
import { grid, vstack } from "../../styled-system/patterns";
import { loggedExerciseLines } from "../result-text";
import { Skeleton } from "../ui";

type Props = {
  /** Exercise display names by id, so a result reads as a movement rather than
   *  its raw id. */
  exerciseNames: ReadonlyMap<string, string>;
  results: readonly ExerciseResult[];
};

/**
 * The set-by-set record of a finished session: each logged exercise with the
 * work put against it — reps and load per strength set, or a one-line effort
 * summary for a cardio piece — so a historical workout shows what was actually
 * done, not just what it changed for next time.
 */
export const SessionLog = ({ exerciseNames, results }: Props) => (
  <section className={sectionStyles}>
    <h2 className={titleStyles}>What you logged</h2>
    <ul className={listStyles}>
      {results.map((result) => (
        <li className={exerciseStyles} key={result.id}>
          <span className={nameStyles}>
            {exerciseNames.get(result.exerciseId) ?? result.exerciseId}
          </span>
          <ul className={setListStyles}>
            {loggedExerciseLines(result).map((line, index) => (
              <li className={rowStyles} key={`${result.id}-${index}`}>
                {line.label !== "" && (
                  <span className={labelStyles}>{line.label}</span>
                )}
                <span className={valueStyles}>{line.value}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  </section>
);

/** The {@link SessionLog} in its loading state: the same ruled "What you logged"
 *  panel with a representative run of placeholder exercises and set lines, so the
 *  recap holds its place until the real log resolves. */
export const SessionLogSkeleton = () => (
  <section className={sectionStyles}>
    <h2 className={titleStyles}>What you logged</h2>
    <ul className={listStyles}>
      {PLACEHOLDER_EXERCISES.map((exercise) => (
        <li className={exerciseStyles} key={exercise}>
          <Skeleton height="1rem" width="9rem" />
          <ul className={setListStyles}>
            {PLACEHOLDER_SETS.map((set) => (
              <li className={rowStyles} key={set}>
                <Skeleton height="0.875rem" width="4rem" />
                <Skeleton height="0.875rem" width="5rem" />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  </section>
);

// Four placeholder exercises of three sets each — a representative session.
const PLACEHOLDER_EXERCISES = [0, 1, 2, 3];
const PLACEHOLDER_SETS = [0, 1, 2];

const sectionStyles = vstack({ alignItems: "stretch", gap: 3 });

// Matches the recap's other panels: a ruled heading with a hint of accent in
// the rule so the log doesn't read flat-gray.
const titleStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  fontSize: "lg",
  fontWeight: "semibold",
  paddingBlockEnd: 2,
});

// On a phone this is a single stacked column; once there's room the logged
// exercises tile into as many columns as fit instead of one full-width strip
// stranding horizontal space. Mirrors the recap panels' grid on this page.
const listStyles = grid({
  alignItems: "start",
  gap: 4,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
  lg: { gap: 6 },
});

const exerciseStyles = vstack({ alignItems: "stretch", gap: 1.5 });

const nameStyles = css({ fontWeight: "medium" });

const setListStyles = vstack({ alignItems: "stretch", gap: 0 });

// Hairline-ruled set rows: the set label on the start, the logged work on the
// trailing edge. No rule above the first row.
const rowStyles = css({
  _first: { borderBlockStart: "none", paddingBlockStart: 0 },
  alignItems: "baseline",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
  paddingBlock: 1.5,
});

const labelStyles = css({
  color: "textTertiary",
  fontSize: "sm",
  fontWeight: "medium",
});

// Mono with tabular figures so loads line up down the column instead of ragging.
const valueStyles = css({
  fontFamily: "mono",
  fontVariantNumeric: "tabular-nums",
  marginInlineStart: "auto",
});
