import { getConnection } from "@titan/db/external-connections";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import { css } from "../../../styled-system/css";
import { hstack, vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { Concept2Controls } from "../../components/Concept2Controls";
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
    <div className={vstack({ alignItems: "stretch", gap: 4 })}>
      <h1 className={titleStyles}>Settings</h1>

      <section className={cardStyles}>
        <div className={appearanceRowStyles}>
          <div className={vstack({ alignItems: "flex-start", gap: 0.5 })}>
            <h2 className={sectionTitleStyles}>Appearance</h2>
            <p className={mutedStyles}>
              Switch between light, dark, and system.
            </p>
          </div>
          <ThemeSwitch />
        </div>
      </section>

      <section className={cardStyles}>
        <h2 className={sectionTitleStyles}>Concept2 rowing</h2>
        <p className={mutedStyles}>
          {connection === undefined
            ? "Connect your Concept2 Logbook to import rows and heart-rate data."
            : `${externals.length} imported workouts.`}
        </p>
        <Concept2Controls connected={connection !== undefined} />
      </section>
    </div>
  );
};

export default SettingsPage;

const titleStyles = css({ fontSize: "3xl", fontWeight: "bold" });

const cardStyles = vstack({
  alignItems: "stretch",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "xl",
  gap: 3,
  padding: 4,
});

const appearanceRowStyles = hstack({
  gap: 3,
  justifyContent: "space-between",
});

const sectionTitleStyles = css({ fontSize: "md", fontWeight: "semibold" });

const mutedStyles = css({ color: "muted", fontSize: "sm" });
