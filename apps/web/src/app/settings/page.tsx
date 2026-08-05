import { getConnection } from "@titan/db/external-connections";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import type { ReactNode } from "react";
import { css } from "../../../styled-system/css";
import { vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { Concept2Controls } from "../../components/Concept2Controls";
import { TopBar } from "../../components/TopBar";
import { db } from "../../db";
import { ThemeSwitch } from "../../ui";
import { USER_ID } from "../../user";

const SettingsPage = async () => {
  await requireAuth();
  const [connection, externals] = await Promise.all([
    getConnection(db, USER_ID, "concept2"),
    listExternalWorkouts(db, USER_ID, 100),
  ]);

  return (
    <div className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}>
      <TopBar
        description="Appearance and connected services."
        title="Settings"
      />

      <div className={groupStyles}>
        <SettingRow
          control={<ThemeSwitch />}
          description="Switch between light, dark, and system."
          title="Appearance"
        />
        <SettingRow
          control={<Concept2Controls connected={connection !== undefined} />}
          description={
            connection === undefined
              ? "Connect your Concept2 Logbook to import rows and heart-rate data."
              : `${externals.length} imported workouts.`
          }
          title="Concept2 rowing"
        />
      </div>
    </div>
  );
};

export default SettingsPage;

/** One settings entry: a titled description on the start edge and its control
 *  on the end edge, side by side on wider screens and stacked on phones. */
const SettingRow = ({
  control,
  description,
  title,
}: {
  control: ReactNode;
  description: string;
  title: string;
}) => (
  <section className={rowStyles}>
    <div className={textStyles}>
      <h2 className={sectionTitleStyles}>{title}</h2>
      <p className={mutedStyles}>{description}</p>
    </div>
    <div className={controlStyles}>{control}</div>
  </section>
);

// The settings themselves are borderless rows divided by hairlines — the first
// rule sits above the top row so the group reads as one ledger.
const groupStyles = css({
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  flexDirection: "column",
});

const rowStyles = css({
  alignItems: "flex-start",
  borderBlockEnd: "1px solid {colors.border}",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  justifyContent: "space-between",
  paddingBlock: 5,
  sm: { alignItems: "center", flexDirection: "row", gap: 6 },
});

const textStyles = vstack({
  alignItems: "flex-start",
  gap: 1,
  minInlineSize: 0,
});

const controlStyles = css({ flexShrink: 0 });

const sectionTitleStyles = css({
  fontSize: "md",
  fontWeight: "semibold",
  lg: { fontSize: "lg" },
});

const mutedStyles = css({ color: "muted", fontSize: "sm" });
