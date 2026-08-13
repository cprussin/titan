import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { css, cva } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import type { Loadable } from "../loadable";
import type {
  DashboardEyebrow,
  DashboardPrimary,
} from "../server/dashboard-view";
import { Button, Skeleton } from "../ui";
import { WeighInButton } from "./WeighInButton";
import { WorkoutActionControl } from "./WorkoutActionControl";

export type DashboardHeaderData = {
  eyebrow: DashboardEyebrow;
  primary: DashboardPrimary;
  title: string;
  /** Passed through to the weigh-in button, which hides once today is logged. */
  weighedInToday: boolean;
};

type Props = {
  load: Loadable<DashboardHeaderData>;
};

/** The dashboard's headline, describing the selected day: an eyebrow that places
 *  it (program, week count, and — away from today — its standing), the session
 *  title, and the trailing actions (a weigh-in button beside the day's primary
 *  action). While loading, each of these stands in as a skeleton so the headline
 *  keeps its footprint. */
export const DashboardHeader = ({ load }: Props) => (
  <div className={headerStyles}>
    <div className={leadStyles}>
      <div className={eyebrowStyles}>
        {load.isLoading ? (
          <>
            <Skeleton height="0.75rem" width="9rem" />
            <Skeleton height="0.875rem" width="3.5rem" />
          </>
        ) : (
          <Eyebrow eyebrow={load.value.eyebrow} />
        )}
      </div>
      {load.isLoading ? (
        <Skeleton height="2.25rem" radius="md" width="14rem" />
      ) : (
        <h2 className={titleStyles}>{load.value.title}</h2>
      )}
    </div>
    <div className={actionsStyles}>
      {load.isLoading ? (
        <Skeleton height="2.75rem" radius="md" width="10rem" />
      ) : (
        <>
          <WeighInButton weighedInToday={load.value.weighedInToday} />
          <PrimaryAction primary={load.value.primary} />
        </>
      )}
    </div>
  </div>
);

/** The eyebrow's three baseline segments, each shown only when present. */
const Eyebrow = ({ eyebrow }: { eyebrow: DashboardEyebrow }) => (
  <>
    {eyebrow.programName !== undefined && (
      <span className={programStyles}>{eyebrow.programName}</span>
    )}
    {eyebrow.weekCount !== undefined && (
      <span className={weekCountStyles}>{eyebrow.weekCount}</span>
    )}
    {eyebrow.status !== undefined && (
      <span className={statusStyles({ tone: eyebrow.status.tone })}>
        {eyebrow.status.text}
      </span>
    )}
  </>
);

const PrimaryAction = ({ primary }: { primary: DashboardPrimary }) => {
  switch (primary.kind) {
    case "none": {
      return undefined;
    }
    case "start-workout": {
      return <WorkoutActionControl action={primary.action} size="xl" />;
    }
    case "back-to-today": {
      return (
        <Button
          beforeIcon={<ArrowLeftIcon size={18} />}
          href="/"
          size="xl"
          variant="ghost"
        >
          Back to today
        </Button>
      );
    }
  }
};

// The lead copy and the trailing actions share a row on wide screens and stack
// on phones, where the actions drop below the title.
const headerStyles = css({
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  md: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
});

const leadStyles = vstack({
  alignItems: "flex-start",
  gap: 1.5,
  minInlineSize: 0,
});

// The three eyebrow segments sit on one baseline, wrapping on a narrow screen.
const eyebrowStyles = css({
  alignItems: "baseline",
  columnGap: 3,
  display: "flex",
  flexWrap: "wrap",
  rowGap: 1,
});

const programStyles = css({
  color: "accent",
  fontSize: "xs",
  fontWeight: "bold",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

// Deliberately a different key from the program name: mono figures for the count.
const weekCountStyles = css({
  color: "muted",
  fontFamily: "mono",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "medium",
});

const statusStyles = cva({
  base: {
    fontSize: "xs",
    fontWeight: "bold",
    letterSpacing: "wide",
    textTransform: "uppercase",
  },
  variants: {
    tone: {
      success: { color: "success" },
      tertiary: { color: "textTertiary" },
    },
  },
});

const titleStyles = css({
  fontFamily: "condensed",
  fontSize: { base: "4xl", lg: "2.875rem" },
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "condensed",
});

const actionsStyles = hstack({ flexShrink: 0, gap: 3 });
