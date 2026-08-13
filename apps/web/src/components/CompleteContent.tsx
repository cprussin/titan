import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import type { ExerciseResult } from "@titan/domain/result";
import { css } from "../../styled-system/css";
import { grid, vstack } from "../../styled-system/patterns";
import type { Loadable } from "../loadable";
import { mapLoadable } from "../loadable";
import { Badge, Skeleton } from "../ui";
import { DeleteWorkoutButton } from "./DeleteWorkoutButton";
import { SessionLog, SessionLogSkeleton } from "./SessionLog";
import { StatTile, StatTileSkeleton } from "./StatTile";
import { TopBar } from "./TopBar";

type AdaptationEntry = {
  exerciseName: string;
  explanation: string;
  progressed: boolean;
  slotId: string;
};

type PersonalRecordEntry = {
  id: string;
  name: string;
  text: string;
};

export type CompleteData = {
  adaptations: readonly AdaptationEntry[];
  exerciseNames: ReadonlyMap<string, string>;
  personalRecords: readonly PersonalRecordEntry[];
  results: readonly ExerciseResult[];
  scheduledDate: string;
  sessionId: string;
  stats: { durationMin: number; prCount: number; totalSets: number };
};

type Props = {
  load: Loadable<CompleteData>;
};

/** The workout-summary page and its loading fallback, sharing one tree: a stat
 *  row, the set-by-set log, and the recap panels (any personal records beside
 *  what changes next session). While loading, the stat row, log, and next-session
 *  panel stand in as skeletons so the summary settles in place once the totals
 *  and adaptations resolve. */
export const CompleteContent = ({ load }: Props) => (
  <div className={pageStyles}>
    <TopBar
      actions={
        load.isLoading ? (
          <Skeleton height="1.75rem" radius="md" width="4rem" />
        ) : (
          <DeleteWorkoutButton sessionId={load.value.sessionId} size="sm" />
        )
      }
      breadcrumbs={[{ href: "/history", label: "History" }]}
      icon={<ClockCounterClockwiseIcon size={18} />}
      title={
        load.isLoading ? (
          <Skeleton height="1rem" width="7rem" />
        ) : (
          load.value.scheduledDate
        )
      }
    />

    <div className={statGridStyles}>
      {load.isLoading ? (
        <>
          <StatTileSkeleton />
          <StatTileSkeleton />
          <StatTileSkeleton />
        </>
      ) : (
        <>
          <StatTile
            label="Duration"
            tone="accent"
            value={`${load.value.stats.durationMin} min`}
          />
          <StatTile label="Sets" value={`${load.value.stats.totalSets}`} />
          <StatTile
            label="PRs"
            tone={load.value.stats.prCount > 0 ? "success" : "neutral"}
            value={`${load.value.stats.prCount}`}
          />
        </>
      )}
    </div>

    {load.isLoading ? (
      <SessionLogSkeleton />
    ) : (
      load.value.results.length > 0 && (
        <SessionLog
          exerciseNames={load.value.exerciseNames}
          results={load.value.results}
        />
      )
    )}

    <div className={sectionsStyles}>
      {!load.isLoading && load.value.personalRecords.length > 0 && (
        <PersonalRecordsSection records={load.value.personalRecords} />
      )}
      <NextSessionSection
        load={mapLoadable(load, (data) => data.adaptations)}
      />
    </div>
  </div>
);

/** The personal-records panel, shown only when the session set one. */
const PersonalRecordsSection = ({
  records,
}: {
  records: readonly PersonalRecordEntry[];
}) => (
  <section className={sectionStyles}>
    <h2 className={sectionTitleStyles}>Personal records</h2>
    <ul className={listStyles}>
      {records.map((record) => (
        <li className={rowStyles} key={record.id}>
          <span>{record.name}</span>
          <span className={emphasisStyles}>{record.text}</span>
        </li>
      ))}
    </ul>
  </section>
);

/** The next-session panel: a hairline-ruled row per adaptation, or a steady-week
 *  note when nothing changes. While loading, placeholder rows stand in. */
const NextSessionSection = ({
  load,
}: {
  load: Loadable<readonly AdaptationEntry[]>;
}) => (
  <section className={sectionStyles}>
    <h2 className={sectionTitleStyles}>Next session</h2>
    <NextSessionBody load={load} />
  </section>
);

/** The panel body: placeholder rows while loading, the steady-week note when
 *  nothing changes, else a row per adaptation. */
const NextSessionBody = ({
  load,
}: {
  load: Loadable<readonly AdaptationEntry[]>;
}) => {
  if (load.isLoading) {
    return (
      <ul className={adaptationListStyles}>
        {PLACEHOLDER_ADAPTATIONS.map((row) => (
          <li className={adaptationRowStyles} key={row}>
            <span className={adaptationTextStyles}>
              <Skeleton height="1rem" width="9rem" />
              <Skeleton height="0.875rem" width="14rem" />
            </span>
            <Skeleton height="1.25rem" radius="full" width="5rem" />
          </li>
        ))}
      </ul>
    );
  }
  return load.value.length === 0 ? (
    <p className={mutedStyles}>
      Steady week — prescriptions hold from your program.
    </p>
  ) : (
    <ul className={adaptationListStyles}>
      {load.value.map((adaptation) => (
        <li className={adaptationRowStyles} key={adaptation.slotId}>
          <span className={adaptationTextStyles}>
            <span className={adaptationNameStyles}>
              {adaptation.exerciseName}
            </span>
            <span className={explanationStyles}>{adaptation.explanation}</span>
          </span>
          <Badge tone={adaptation.progressed ? "success" : "neutral"}>
            {adaptation.progressed ? "Progressed" : "Held"}
          </Badge>
        </li>
      ))}
    </ul>
  );
};

// Three placeholder adaptation rows stand in before the real ones resolve.
const PLACEHOLDER_ADAPTATIONS = [0, 1, 2];

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

const statGridStyles = grid({ columns: 3, gap: 4, lg: { gap: 8 } });

// The two recap panels sit side by side when both are present and there's
// room; a lone panel (no PRs this session) fills the width instead of stranding
// half of it.
const sectionsStyles = grid({
  alignItems: "start",
  gap: 6,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
  lg: { gap: 10 },
});

const sectionStyles = vstack({ alignItems: "stretch", gap: 3 });

// A ruled heading structures each panel without wrapping it in a box; a hint of
// accent in the rule keeps the recap from reading flat-gray.
const sectionTitleStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  fontSize: "lg",
  fontWeight: "semibold",
  paddingBlockEnd: 2,
});

const listStyles = vstack({ alignItems: "stretch", gap: 2 });

const rowStyles = css({
  alignItems: "center",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
});

const emphasisStyles = css({ color: "success", fontWeight: "semibold" });

// Each adaptation is a hairline-ruled row: the exercise over its reason on the
// start, a Progressed/Held badge on the trailing edge. No rule above the first.
const adaptationRowStyles = css({
  _first: { borderBlockStart: "none", paddingBlockStart: 0 },
  alignItems: "flex-start",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
  paddingBlock: 2.5,
});

const adaptationListStyles = vstack({
  alignItems: "stretch",
  gap: 0,
  listStyleType: "none",
  margin: 0,
  padding: 0,
});

const adaptationTextStyles = vstack({
  alignItems: "flex-start",
  gap: 0.5,
  minInlineSize: 0,
});

const adaptationNameStyles = css({ fontWeight: "medium" });

const explanationStyles = css({ color: "muted", fontSize: "sm" });

const mutedStyles = css({ color: "muted" });
