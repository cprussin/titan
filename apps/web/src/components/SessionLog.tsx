import type { ExerciseResult } from "@titan/domain/result";
import { css } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";
import { loggedExerciseLines } from "../result-text";

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

const listStyles = vstack({ alignItems: "stretch", gap: 4 });

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
