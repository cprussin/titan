import type { ReactNode } from "react";
import { cva } from "../../styled-system/css";

export const TONES = [
  "accent",
  "success",
  "warning",
  "danger",
  "neutral",
] as const;
export type Tone = (typeof TONES)[number];

type Props = {
  children: ReactNode;
  tone?: Tone | undefined;
};

/**
 * A small tinted label — a role, a goal, a status. Each tone is a soft fill of
 * a semantic color with matching text, so a wall of neutral text gets some
 * legible color without turning into a box: the badge is the one bit of chrome
 * the flat layouts keep. Defaults to `neutral`.
 */
export const Badge = ({ children, tone = "neutral" }: Props) => (
  <span className={badgeStyles({ tone })}>{children}</span>
);

const badgeStyles = cva({
  base: {
    alignItems: "center",
    borderRadius: "full",
    display: "inline-flex",
    fontSize: "xs",
    fontWeight: "medium",
    paddingBlock: 0.5,
    paddingInline: 2,
    whiteSpace: "nowrap",
  },
  variants: {
    tone: {
      accent: {
        backgroundColor:
          "color-mix(in oklab, {colors.accent} 15%, transparent)",
        color: "color-mix(in oklab, {colors.accent} 80%, {colors.foreground})",
      },
      danger: {
        backgroundColor:
          "color-mix(in oklab, {colors.danger} 15%, transparent)",
        color: "color-mix(in oklab, {colors.danger} 82%, {colors.foreground})",
      },
      neutral: {
        backgroundColor:
          "color-mix(in oklab, {colors.foreground} 8%, transparent)",
        color: "textTertiary",
      },
      success: {
        backgroundColor:
          "color-mix(in oklab, {colors.success} 16%, transparent)",
        color: "color-mix(in oklab, {colors.success} 80%, {colors.foreground})",
      },
      warning: {
        backgroundColor:
          "color-mix(in oklab, {colors.warning} 16%, transparent)",
        color: "color-mix(in oklab, {colors.warning} 82%, {colors.foreground})",
      },
    },
  },
});
