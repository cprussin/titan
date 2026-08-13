import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";
import type { Loadable } from "../loadable";
import { mapLoadable } from "../loadable";
import { Skeleton, ThemeSwitch } from "../ui";
import { Concept2Controls } from "./Concept2Controls";
import { DeleteHistoryButton } from "./DeleteHistoryButton";
import { LogOutButton } from "./LogOutButton";
import { TopBar } from "./TopBar";

export type SettingsData = {
  accountEmail: string;
  concept2Connected: boolean;
  concept2WorkoutCount: number;
};

type Props = {
  load: Loadable<SettingsData>;
};

/** The settings page and its loading fallback, sharing one tree. The row titles
 *  are fixed, so they render the same in both states; only each row's dynamic
 *  description and its control resolve from `load`, standing in as skeletons
 *  while loading. */
export const SettingsContent = ({ load }: Props) => (
  <div className={pageStyles}>
    <TopBar icon={<GearIcon size={18} />} title="Settings" />
    <div className={groupStyles}>
      <SettingRow
        controlWidth="5rem"
        load={mapLoadable(load, (data) => ({
          control: <LogOutButton />,
          description: `Signed in as ${data.accountEmail}.`,
        }))}
        title="Account"
      />
      <SettingRow
        controlWidth="9rem"
        load={mapLoadable(load, () => ({
          control: <ThemeSwitch />,
          description: "Switch between light, dark, and system.",
        }))}
        title="Appearance"
      />
      <SettingRow
        controlWidth="7rem"
        load={mapLoadable(load, (data) => ({
          control: <Concept2Controls connected={data.concept2Connected} />,
          description: data.concept2Connected
            ? `${data.concept2WorkoutCount} imported workouts.`
            : "Connect your Concept2 Logbook to import rows and heart-rate data.",
        }))}
        title="Concept2 rowing"
      />
      <SettingRow
        controlWidth="7rem"
        load={mapLoadable(load, () => ({
          control: <DeleteHistoryButton />,
          description: "Permanently delete all logged workouts and weigh-ins.",
        }))}
        title="Delete history"
      />
    </div>
  </div>
);

type SettingRowData = {
  control: ReactNode;
  description: string;
};

/** One settings entry: a titled description on the start edge and its control
 *  on the end edge, side by side on wider screens and stacked on phones. The
 *  title is fixed; the description and control are skeletons while loading. */
const SettingRow = ({
  controlWidth,
  load,
  title,
}: {
  /** The loading skeleton's width, approximating the real control. */
  controlWidth: string;
  load: Loadable<SettingRowData>;
  title: string;
}) => (
  <section className={rowStyles}>
    <div className={textStyles}>
      <h2 className={sectionTitleStyles}>{title}</h2>
      {load.isLoading ? (
        <Skeleton height="0.875rem" width="16rem" />
      ) : (
        <p className={mutedStyles}>{load.value.description}</p>
      )}
    </div>
    <div className={controlStyles}>
      {load.isLoading ? (
        <Skeleton height="2.25rem" radius="md" width={controlWidth} />
      ) : (
        load.value.control
      )}
    </div>
  </section>
);

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

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
