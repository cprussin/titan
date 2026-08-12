import { css, cva } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";
import type { DashboardTrailing } from "../server/dashboard-view";
import { Button } from "../ui";
import { WorkoutActionControl } from "./WorkoutActionControl";

type Props = {
  eyebrow: string;
  eyebrowTone: "accent" | "success" | "tertiary";
  subtitle: string | undefined;
  title: string;
  trailing: DashboardTrailing;
};

/** The dashboard's top row: an eyebrow that places the day, the day's session
 *  title, an optional summary subtitle, and — on the trailing edge — the day's
 *  action, whether launching today's workout, returning to today, or the
 *  post-workout next-up notes. */
export const DashboardHeader = ({
  eyebrow,
  eyebrowTone,
  subtitle,
  title,
  trailing,
}: Props) => (
  <div className={headerStyles}>
    <div className={leadStyles}>
      <span className={eyebrowStyles({ tone: eyebrowTone })}>{eyebrow}</span>
      <h2 className={titleStyles}>{title}</h2>
      {subtitle !== undefined && <p className={subtitleStyles}>{subtitle}</p>}
    </div>
    <Trailing trailing={trailing} />
  </div>
);

const Trailing = ({ trailing }: { trailing: DashboardTrailing }) => {
  switch (trailing.kind) {
    case "none": {
      return undefined;
    }
    case "back-to-today": {
      return (
        <Button href="/" size="xl" variant="ghost">
          Back to today
        </Button>
      );
    }
    case "start-workout": {
      return <WorkoutActionControl action={trailing.action} size="xl" />;
    }
    case "completed": {
      return (
        <div className={completedStyles}>
          {trailing.nextLabel !== undefined && (
            <span className={completedLineStyles}>
              Next: {trailing.nextLabel}
            </span>
          )}
          <span className={completedLineStyles}>{trailing.recovery}</span>
        </div>
      );
    }
  }
};

// The lead copy and the trailing action share a row on wide screens and stack
// on phones, where the action drops below the title.
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

const eyebrowStyles = cva({
  base: {
    fontSize: "xs",
    fontWeight: "bold",
    letterSpacing: "wide",
    textTransform: "uppercase",
  },
  variants: {
    tone: {
      accent: { color: "accent" },
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

const subtitleStyles = css({ color: "muted", fontSize: "sm" });

const completedStyles = vstack({
  alignItems: "flex-start",
  flexShrink: 0,
  gap: 1.5,
  md: { alignItems: "flex-end" },
});

const completedLineStyles = css({ color: "muted", fontSize: "sm" });
