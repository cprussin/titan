import { css, cva, cx } from "../../styled-system/css";
import type { LoggedExercise } from "../server/logged-session-view";

type Props = {
  exercises: readonly LoggedExercise[];
};

/** A completed session as a ledger: prescribed versus done and the average RPE,
 *  the done column toned success when a piece met its target and warning when it
 *  fell short. A real table for assistive tech; CSS grid rules the columns. */
export const LogGrid = ({ exercises }: Props) => (
  <table className={gridStyles}>
    <thead className={contentsStyles}>
      <tr className={headerRowStyles}>
        <th className={headStyles} scope="col">
          Exercise
        </th>
        <th className={cx(headStyles, numericStyles)} scope="col">
          Prescribed
        </th>
        <th className={cx(headStyles, numericStyles)} scope="col">
          Done
        </th>
        <th className={cx(headStyles, numericStyles)} scope="col">
          Avg RPE
        </th>
      </tr>
    </thead>
    <tbody className={contentsStyles}>
      {exercises.map((exercise) => (
        <tr className={rowStyles} key={exercise.name}>
          <td className={nameStyles}>
            {exercise.name}
            {exercise.isPrimary && <span className={tagStyles}>Primary</span>}
          </td>
          <td className={cx(figureStyles, numericStyles)}>
            {exercise.prescribed}
          </td>
          <td
            className={cx(
              doneStyles({ met: exercise.isAsPrescribed }),
              numericStyles,
            )}
          >
            {exercise.done}
          </td>
          <td className={cx(figureStyles, numericStyles)}>
            {exercise.avgRpe ?? "—"}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const gridStyles = css({ display: "grid", width: "100%" });

const contentsStyles = css({ display: "contents" });

// Four columns — exercise, prescribed, done, avg RPE — the numeric three
// fixed-width and narrower on phones. A 35%-accent hairline underlines the
// header. The track is inlined per row so Panda's static extractor emits it.
const headerRowStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  columnGap: 6,
  display: "grid",
  gridTemplateColumns: {
    base: "1fr 4.5rem 4.5rem 3.5rem",
    md: "1fr 8.75rem 8.75rem 9.375rem",
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
    base: "1fr 4.5rem 4.5rem 3.5rem",
    md: "1fr 8.75rem 8.75rem 9.375rem",
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

// The done column carries the outcome color: success when the piece met its
// target, warning when it fell short.
const doneStyles = cva({
  base: {
    fontFamily: "mono",
    fontSize: { base: "sm", md: "md" },
    fontVariantNumeric: "tabular-nums",
    fontWeight: "semibold",
  },
  variants: {
    met: {
      false: { color: "warning" },
      true: { color: "success" },
    },
  },
});
