import type { PrescribedExercise } from "@titan/domain/workout-session";
import { css, cx } from "../../styled-system/css";
import type { Loadable } from "../loadable";
import { prescriptionColumns } from "../prescription-columns";
import { Skeleton } from "../ui";
import { FigureSkeleton } from "./FigureSkeleton";

export type PrescriptionGridData = {
  exercises: readonly PrescribedExercise[];
  /** The load column's heading — "Load" for today, "Projected load" for a
   *  future day whose figures are engine projections. */
  loadHeader?: string;
  names: ReadonlyMap<string, string>;
};

type Props = {
  load: Loadable<PrescriptionGridData>;
};

/** Today's (or a projected day's) prescription as a hairline ledger: exercise,
 *  scheme, and load, with the primary lift flagged. A real table so it reads as
 *  tabular data to assistive tech; CSS grid gives it the ruled columns. While
 *  loading, a representative run of placeholder rows fills the same ledger so it
 *  holds its place until the real prescription resolves. */
export const PrescriptionGrid = ({ load }: Props) => (
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
          {load.isLoading ? "Load" : (load.value.loadHeader ?? "Load")}
        </th>
      </tr>
    </thead>
    <tbody className={contentsStyles}>
      {load.isLoading
        ? PLACEHOLDER_ROWS.map((row) => (
            <PrescriptionRow key={row} load={{ isLoading: true }} />
          ))
        : load.value.exercises.map((exercise) => (
            <PrescriptionRow
              key={exercise.slotId}
              load={{
                isLoading: false,
                value: toRow(exercise, load.value.names),
              }}
            />
          ))}
    </tbody>
  </table>
);

type PrescriptionRowData = {
  isPrimary: boolean;
  loadText: string;
  name: string;
  scheme: string;
};

/** One ledger row: the exercise (with its primary flag), scheme, and load — each
 *  a skeleton while loading. */
const PrescriptionRow = ({ load }: { load: Loadable<PrescriptionRowData> }) => (
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
      {load.isLoading ? <FigureSkeleton width="3rem" /> : load.value.scheme}
    </td>
    <td className={cx(figureStyles, loadStyles, numericStyles)}>
      {load.isLoading ? <FigureSkeleton width="4rem" /> : load.value.loadText}
    </td>
  </tr>
);

/** Flatten a prescribed exercise into the row's display fields. */
const toRow = (
  exercise: PrescribedExercise,
  names: ReadonlyMap<string, string>,
): PrescriptionRowData => {
  const { load, scheme } = prescriptionColumns(exercise.prescription);
  return {
    isPrimary: exercise.role === "primary",
    loadText: load ?? "—",
    name: names.get(exercise.exerciseId) ?? exercise.exerciseId,
    scheme,
  };
};

// Five placeholder rows — a representative session length — fill the ledger
// before the real prescription lands.
const PLACEHOLDER_ROWS = [0, 1, 2, 3, 4];

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
