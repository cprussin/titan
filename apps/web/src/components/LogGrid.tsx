import { css, cva, cx } from "../../styled-system/css";
import type { Loadable } from "../loadable";
import type { LoggedExercise } from "../server/logged-session-view";
import { Skeleton } from "../ui";
import { FigureSkeleton } from "./FigureSkeleton";

export type LogGridData = {
  exercises: readonly LoggedExercise[];
};

type Props = {
  load: Loadable<LogGridData>;
};

/** A completed session as a ledger: prescribed versus done and the average RPE,
 *  the done column toned success when a piece met its target and warning when it
 *  fell short. A real table for assistive tech; CSS grid rules the columns.
 *  While loading, placeholder rows fill the same ledger. */
export const LogGrid = ({ load }: Props) => (
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
      {load.isLoading
        ? PLACEHOLDER_ROWS.map((row) => (
            <LogRow key={row} load={{ isLoading: true }} />
          ))
        : load.value.exercises.map((exercise) => (
            <LogRow
              key={exercise.name}
              load={{ isLoading: false, value: exercise }}
            />
          ))}
    </tbody>
  </table>
);

/** One ledger row: the exercise (with its primary flag), the prescribed and done
 *  columns, and the average RPE — each a skeleton while loading. */
const LogRow = ({ load }: { load: Loadable<LoggedExercise> }) => (
  <tr className={rowStyles}>
    <td className={nameStyles}>
      {load.isLoading ? (
        <Skeleton height="1.25rem" width="9rem" />
      ) : (
        <>
          {load.value.name}
          {load.value.isPrimary && <span className={tagStyles}>Primary</span>}
        </>
      )}
    </td>
    <td className={cx(figureStyles, numericStyles)}>
      {load.isLoading ? <FigureSkeleton width="4rem" /> : load.value.prescribed}
    </td>
    <td
      className={cx(
        doneStyles({ met: load.isLoading || load.value.isAsPrescribed }),
        numericStyles,
      )}
    >
      {load.isLoading ? <FigureSkeleton width="4rem" /> : load.value.done}
    </td>
    <td className={cx(figureStyles, numericStyles)}>
      {load.isLoading ? (
        <FigureSkeleton width="2.5rem" />
      ) : (
        (load.value.avgRpe ?? "—")
      )}
    </td>
  </tr>
);

// Five placeholder rows fill the ledger before the real session lands.
const PLACEHOLDER_ROWS = [0, 1, 2, 3, 4];

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
