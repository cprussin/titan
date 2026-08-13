import { GaugeIcon } from "@phosphor-icons/react/dist/ssr/Gauge";
import { css, cx } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";
import type { Loadable } from "../loadable";
import { mapLoadable } from "../loadable";
import type { DashboardBody, DashboardSession } from "../server/dashboard-view";
import type { DashboardHeaderData } from "./DashboardHeader";
import { DashboardHeader } from "./DashboardHeader";
import { LogGrid } from "./LogGrid";
import { NoteAside } from "./NoteAside";
import { PrescriptionGrid } from "./PrescriptionGrid";
import { SessionHeader } from "./SessionHeader";
import { TopBar } from "./TopBar";
import type { TrendsBandData } from "./TrendsBand";
import { TrendsBand } from "./TrendsBand";
import type { WeekRibbonData } from "./WeekRibbon";
import { WeekRibbon } from "./WeekRibbon";
import { WeighInProvider } from "./WeighInContext";

export type DashboardData = {
  body: DashboardBody;
  header: DashboardHeaderData;
  names: ReadonlyMap<string, string>;
  session: DashboardSession | undefined;
  trends: TrendsBandData;
  week: WeekRibbonData;
};

type Props = {
  load: Loadable<DashboardData>;
};

/** The dashboard's whole content, shared by the page and its loading fallback.
 *  The single `load` prop is threaded down to every section, so the loading
 *  placeholder renders the exact same tree — TopBar, trends band, week picker,
 *  headline, and session block — with skeletons standing in only at the leaves
 *  that carry data. That is what keeps the loading state from drifting out of
 *  sync with the loaded one. */
export const DashboardContent = ({ load }: Props) => (
  <div className={pageStyles}>
    <TopBar icon={<GaugeIcon size={18} />} title="Dashboard" />
    <WeighInProvider>
      <div className={contentStyles}>
        <TrendsBand load={mapLoadable(load, (data) => data.trends)} />
        <div className={sectionStyles}>
          <WeekRibbon load={mapLoadable(load, (data) => data.week)} />
        </div>
        <div className={sectionStyles}>
          <DashboardHeader load={mapLoadable(load, (data) => data.header)} />
        </div>
        <SessionBlock
          load={mapLoadable(load, (data) => ({
            body: data.body,
            names: data.names,
            session: data.session,
          }))}
        />
      </div>
    </WeighInProvider>
  </div>
);

type SessionBlockData = {
  body: DashboardBody;
  names: ReadonlyMap<string, string>;
  session: DashboardSession | undefined;
};

/** The session block: the session header over the day's grid, or a rest
 *  message. Adaptation notes follow a logged grid; a projection's caveat is
 *  already in the session summary, so a prescription needs no aside. While
 *  loading, it stands in a representative prescription so the block keeps its
 *  shape until the day resolves. */
const SessionBlock = ({ load }: { load: Loadable<SessionBlockData> }) => {
  if (load.isLoading) {
    return (
      <section className={cx(sectionStyles, blockStyles)}>
        <SessionHeader load={{ isLoading: true }} />
        <PrescriptionGrid load={{ isLoading: true }} />
      </section>
    );
  }
  const { body, names, session } = load.value;
  switch (body.kind) {
    case "rest": {
      return (
        <section className={sectionStyles}>
          <p className={copyStyles}>{body.copy}</p>
        </section>
      );
    }
    case "prescription": {
      return (
        <section className={cx(sectionStyles, blockStyles)}>
          {session !== undefined && (
            <SessionHeader load={{ isLoading: false, value: session }} />
          )}
          <PrescriptionGrid
            load={{
              isLoading: false,
              value: {
                exercises: body.exercises,
                loadHeader: body.loadHeader,
                names,
              },
            }}
          />
        </section>
      );
    }
    case "log": {
      return (
        <section className={cx(sectionStyles, blockStyles)}>
          {session !== undefined && (
            <SessionHeader load={{ isLoading: false, value: session }} />
          )}
          <LogGrid
            load={{
              isLoading: false,
              value: { exercises: body.view.exercises },
            }}
          />
          <NoteAside notes={body.view.notes} />
        </section>
      );
    }
  }
};

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

// The redesigned dashboard flows as one column, capped at a readable measure and
// centered. Trends open it; each later section is set off by a hairline rule.
const contentStyles = vstack({
  alignItems: "stretch",
  gap: 6,
  marginInline: "auto",
  maxInlineSize: "64rem",
  width: "100%",
});

const sectionStyles = css({
  borderBlockStart: "1px solid {colors.border}",
  paddingBlockStart: 6,
});

const blockStyles = css({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "column",
  gap: 6,
});

const copyStyles = css({
  color: "muted",
  fontSize: "sm",
  maxInlineSize: "40rem",
});
