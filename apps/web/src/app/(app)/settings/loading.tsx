import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { css } from "../../../../styled-system/css";
import { vstack } from "../../../../styled-system/patterns";
import { TopBar } from "../../../components/TopBar";
import { Skeleton } from "../../../ui";

// The settings rows are fixed — only each row's description and its control are
// data-dependent — so the loading state keeps the real titles and skeletons only
// the parts that load. Control widths approximate each row's real control.
const ROWS = [
  { control: "5rem", title: "Account" },
  { control: "9rem", title: "Appearance" },
  { control: "7rem", title: "Concept2 rowing" },
  { control: "7rem", title: "Delete history" },
] as const;

/**
 * Loading state for settings. Renders the real row titles with skeletons in
 * place of each row's dynamic description and its control.
 */
const SettingsLoading = () => (
  <div className={pageStyles}>
    <TopBar icon={<GearIcon size={18} />} title="Settings" />
    <div className={groupStyles}>
      {ROWS.map((row) => (
        <section className={rowStyles} key={row.title}>
          <div className={textStyles}>
            <h2 className={titleStyles}>{row.title}</h2>
            <Skeleton height="0.875rem" width="16rem" />
          </div>
          <div className={controlStyles}>
            <Skeleton height="2.25rem" radius="md" width={row.control} />
          </div>
        </section>
      ))}
    </div>
  </div>
);

export default SettingsLoading;

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

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

const titleStyles = css({
  fontSize: "md",
  fontWeight: "semibold",
  lg: { fontSize: "lg" },
});
