import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { css } from "../../../../../../../styled-system/css";
import { vstack } from "../../../../../../../styled-system/patterns";
import { TopBar } from "../../../../../../components/TopBar";
import { Skeleton } from "../../../../../../ui";

/**
 * Loading state for a program block. Renders the day-by-day schedule shape —
 * ruled day headers over two-column exercise lists — with skeletons so the
 * schedule holds its place while the block resolves.
 */
const BlockLoading = () => (
  <div className={pageStyles}>
    <TopBar
      actions={<Skeleton height="1.75rem" radius="md" width="6rem" />}
      breadcrumbs={[{ href: "/programs", label: "Programs" }]}
      icon={<BarbellIcon size={18} />}
      title={<Skeleton height="1rem" width="8rem" />}
    />

    {DAYS.map((day) => (
      <section className={dayStyles} key={day}>
        <div className={dayHeaderStyles}>
          <div className={dayHeadingStyles}>
            <Skeleton height="0.75rem" width="4rem" />
            <Skeleton height="1.25rem" width="10rem" />
          </div>
          <Skeleton height="0.875rem" width="3rem" />
        </div>
        <ul className={slotListStyles}>
          {SLOTS.map((slot) => (
            <li className={slotRowStyles} key={slot}>
              <div className={slotTextStyles}>
                <Skeleton height="1rem" width="9rem" />
                <Skeleton height="0.875rem" width="6rem" />
              </div>
              <Skeleton height="1.25rem" radius="full" width="4.5rem" />
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

export default BlockLoading;

// Three days, four exercise slots each — a representative block schedule.
const DAYS = [0, 1, 2];
const SLOTS = [0, 1, 2, 3];

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

const dayStyles = css({ display: "flex", flexDirection: "column", gap: 3 });

const dayHeaderStyles = css({
  alignItems: "center",
  borderBlockEnd: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
  paddingBlockEnd: 2,
});

const dayHeadingStyles = vstack({ alignItems: "flex-start", gap: 0.5 });

const slotListStyles = css({
  columnGap: 10,
  display: "grid",
  gridTemplateColumns: { base: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
  rowGap: 3,
});

const slotRowStyles = css({
  alignItems: "center",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
});

const slotTextStyles = vstack({ alignItems: "flex-start", gap: 0.5 });
