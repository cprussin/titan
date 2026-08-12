import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { css } from "../../../../../../styled-system/css";
import { hstack, vstack } from "../../../../../../styled-system/patterns";
import { TopBar } from "../../../../../components/TopBar";
import { Skeleton } from "../../../../../ui";

/**
 * Loading state for the workout execution screen. Mirrors its layout — the
 * progress track, the current-exercise header and logger, and the desktop
 * session outline — with skeletons so the screen doesn't jump when the session
 * loads.
 */
const WorkoutLoading = () => (
  <div className={rootStyles}>
    <TopBar
      actions={<Skeleton height="1.75rem" radius="md" width="4.5rem" />}
      icon={<BarbellIcon size={18} />}
      title="Current Workout"
    />

    <div className={progressTrackStyles}>
      {PROGRESS_SEGMENTS.map((segment) => (
        <div className={progressSegmentStyles} key={segment}>
          <Skeleton height="0.25rem" radius="full" />
        </div>
      ))}
    </div>

    <div className={bodyStyles}>
      <div className={mainColStyles}>
        <div className={headerStyles}>
          <Skeleton height="1.25rem" radius="full" width="5rem" />
          <Skeleton height="2.25rem" radius="md" width="14rem" />
          <Skeleton height="1.25rem" width="9rem" />
        </div>

        <div className={fieldsStyles}>
          {FIELDS.map((field) => (
            <Skeleton height="2.75rem" key={field} radius="md" />
          ))}
          <Skeleton height="3rem" radius="md" />
        </div>
      </div>

      <aside className={asideStyles}>
        <Skeleton height="0.875rem" width="5rem" />
        <ol className={outlineListStyles}>
          {OUTLINE_ROWS.map((row) => (
            <li className={outlineRowStyles} key={row}>
              <Skeleton height="0.875rem" width="1rem" />
              <div className={outlineTextStyles}>
                <Skeleton height="0.875rem" width="8rem" />
                <Skeleton height="0.75rem" width="5rem" />
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  </div>
);

export default WorkoutLoading;

const PROGRESS_SEGMENTS = [0, 1, 2, 3, 4, 5, 6];
const FIELDS = [0, 1, 2];
const OUTLINE_ROWS = [0, 1, 2, 3, 4, 5];

const rootStyles = vstack({ alignItems: "stretch", gap: 4 });

const progressTrackStyles = hstack({ gap: 1 });

const progressSegmentStyles = css({ flex: 1 });

const bodyStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  lg: {
    alignItems: "start",
    display: "grid",
    gap: 8,
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
  },
});

const mainColStyles = vstack({ alignItems: "stretch", gap: 4 });

const headerStyles = vstack({ alignItems: "flex-start", gap: 2 });

const fieldsStyles = vstack({ alignItems: "stretch", gap: 3 });

const asideStyles = css({
  display: "none",
  lg: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    insetBlockStart: 8,
    position: "sticky",
  },
});

const outlineListStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
  listStyleType: "none",
  margin: 0,
  padding: 0,
});

const outlineRowStyles = hstack({ alignItems: "flex-start", gap: 2.5 });

const outlineTextStyles = vstack({ alignItems: "flex-start", gap: 0.5 });
