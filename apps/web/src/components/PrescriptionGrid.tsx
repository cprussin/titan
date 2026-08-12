import type { PrescribedExercise } from "@titan/domain/workout-session";
import { css, cx } from "../../styled-system/css";
import { prescriptionColumns } from "../prescription-columns";

type Props = {
  exercises: readonly PrescribedExercise[];
  /** The load column's heading — "Load" for today, "Projected load" for a
   *  future day whose figures are engine projections. */
  loadHeader?: string;
  names: ReadonlyMap<string, string>;
};

/** Today's (or a projected day's) prescription as a hairline ledger: exercise,
 *  scheme, and load, with the primary lift flagged. A real table so it reads as
 *  tabular data to assistive tech; CSS grid gives it the ruled columns. */
export const PrescriptionGrid = ({
  exercises,
  loadHeader = "Load",
  names,
}: Props) => (
  <table className={gridStyles}>
    <thead className={contentsStyles}>
      <tr className={headerRowStyles}>
        <th className={headStyles} scope="col">
          Exercise
        </th>
        <th className={cx(headStyles, numericStyles)} scope="col">
          Sets × reps
        </th>
        <th className={cx(headStyles, numericStyles)} scope="col">
          {loadHeader}
        </th>
      </tr>
    </thead>
    <tbody className={contentsStyles}>
      {exercises.map((exercise) => {
        const { load, scheme } = prescriptionColumns(exercise.prescription);
        return (
          <tr className={rowStyles} key={exercise.slotId}>
            <td className={nameStyles}>
              {names.get(exercise.exerciseId) ?? exercise.exerciseId}
              {exercise.role === "primary" && (
                <span className={tagStyles}>Primary</span>
              )}
            </td>
            <td className={cx(figureStyles, numericStyles)}>{scheme}</td>
            <td className={cx(figureStyles, loadStyles, numericStyles)}>
              {load ?? "—"}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

// The table lays out as a stack of grid rows; thead/tbody dissolve so every row
// shares one column track.
const gridStyles = css({ display: "grid", width: "100%" });

const contentsStyles = css({ display: "contents" });

// Three columns — exercise, scheme, load — the numeric two fixed-width and
// narrower on phones. A 35%-accent hairline underlines the header. The column
// track is inlined per row (not shared via spread) so Panda's static extractor
// always emits it.
const headerRowStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  columnGap: 6,
  display: "grid",
  gridTemplateColumns: {
    base: "1fr 3.75rem 5.125rem",
    md: "1fr 9.375rem 11.25rem",
  },
  paddingBlockEnd: 2,
});

const headStyles = css({
  color: "textTertiary",
  fontSize: "xs",
  fontWeight: "bold",
  letterSpacing: "wide",
  textAlign: "start",
  textTransform: "uppercase",
});

const numericStyles = css({ textAlign: "end" });

const rowStyles = css({
  _first: { borderBlockStart: "none" },
  alignItems: "baseline",
  borderBlockStart: "1px solid {colors.border}",
  columnGap: 6,
  display: "grid",
  gridTemplateColumns: {
    base: "1fr 3.75rem 5.125rem",
    md: "1fr 9.375rem 11.25rem",
  },
  paddingBlock: 3,
});

const nameStyles = css({
  fontFamily: "condensed",
  fontSize: "xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "condensed",
  minInlineSize: 0,
});

const tagStyles = css({
  color: "textTertiary",
  fontFamily: "sans",
  fontSize: "xs",
  fontWeight: "bold",
  letterSpacing: "wide",
  marginInlineStart: 2,
  textTransform: "uppercase",
});

const figureStyles = css({
  fontFamily: "mono",
  fontSize: { base: "sm", md: "md" },
  fontVariantNumeric: "tabular-nums",
  fontWeight: "medium",
});

const loadStyles = css({ fontWeight: "semibold" });
