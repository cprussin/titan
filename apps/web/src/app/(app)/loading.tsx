import { GaugeIcon } from "@phosphor-icons/react/dist/ssr/Gauge";
import { css } from "../../../styled-system/css";
import { grid, hstack, vstack } from "../../../styled-system/patterns";
import { TopBar } from "../../components/TopBar";
import { Card, Skeleton } from "../../ui";

/**
 * Loading state for the dashboard. Renders the real page's chrome and its two
 * cards — today's session and the trends panel — with skeletons standing in for
 * the dynamic data, so the layout holds steady when the data arrives.
 */
const DashboardLoading = () => (
  <div className={pageStyles}>
    <TopBar icon={<GaugeIcon size={18} />} title="Dashboard" />

    <Card>
      <div className={summaryHeaderStyles}>
        <Skeleton height="0.75rem" width="10rem" />
        <Skeleton height="1.75rem" radius="md" width="16rem" />
        <Skeleton height="0.875rem" width="20rem" />
      </div>
      <div className={planStyles}>
        {PLAN_GROUPS.map((group) => (
          <div className={groupStyles} key={group}>
            <Skeleton height="0.75rem" width="6rem" />
            <div className={rowListStyles}>
              {PLAN_ROWS.map((row) => (
                <div className={planRowStyles} key={row}>
                  <Skeleton height="1rem" width="9rem" />
                  <Skeleton height="1rem" width="5rem" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>

    <Card title="Trends">
      <div className={statGridStyles}>
        {STAT_TILES.map((tile) => (
          <div className={statTileStyles} key={tile}>
            <Skeleton height="1.75rem" radius="md" width="4rem" />
            <Skeleton height="0.75rem" width="5rem" />
          </div>
        ))}
      </div>
      <div className={chartsStyles}>
        {CHARTS.map((chart) => (
          <div className={chartStyles} key={chart}>
            <div className={chartHeaderStyles}>
              <Skeleton height="0.875rem" width="9rem" />
            </div>
            <div className={chartAreaStyles}>
              <Skeleton height="100%" radius="md" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export default DashboardLoading;

// Two role groups of three exercise rows each, and three trend tiles beside two
// charts — a representative shape for the real content that follows.
const PLAN_GROUPS = [0, 1];
const PLAN_ROWS = [0, 1, 2];
const STAT_TILES = [0, 1, 2];
const CHARTS = [0, 1];

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

const summaryHeaderStyles = vstack({ alignItems: "flex-start", gap: 1.5 });

const planStyles = vstack({
  alignItems: "stretch",
  borderBlockStart: "1px solid {colors.border}",
  gap: 5,
  paddingBlockStart: 5,
});

const groupStyles = vstack({ alignItems: "stretch", gap: 2 });

const rowListStyles = vstack({ alignItems: "stretch", gap: 0 });

const planRowStyles = css({
  _first: { borderBlockStart: "none" },
  alignItems: "center",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  gap: 4,
  justifyContent: "space-between",
  paddingBlock: 2.5,
});

const statGridStyles = grid({ columns: 3, gap: 4, lg: { gap: 8 } });

const statTileStyles = vstack({ alignItems: "flex-start", gap: 0.5 });

const chartsStyles = grid({
  alignItems: "start",
  borderBlockStart: "1px solid {colors.border}",
  gap: 6,
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  lg: { gap: 10 },
  paddingBlockStart: 5,
});

const chartStyles = vstack({ alignItems: "stretch", gap: 3 });

const chartHeaderStyles = hstack({
  gap: 3,
  justifyContent: "space-between",
  minBlockSize: 8,
});

// Matches the Sparkline's own height so the chart region doesn't resize when the
// real trend line renders.
const chartAreaStyles = css({ blockSize: 16, lg: { blockSize: 28 } });
