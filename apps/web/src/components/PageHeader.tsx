import type { ReactNode } from "react";
import { css } from "../../styled-system/css";

type Props = {
  actions?: ReactNode | undefined;
  description?: string | undefined;
  title: string;
};

/**
 * The consistent title block every page opens with: a heading, an optional
 * one-line description, and an optional actions slot that sits beside the
 * heading on wider screens and stacks beneath it on phones. Keeping this in one
 * place gives the pages a shared vertical rhythm instead of each rolling its
 * own title.
 */
export const PageHeader = ({ actions, description, title }: Props) => (
  <div className={rootStyles}>
    <div className={headingStyles}>
      <span className={spineStyles} />
      <div className={textStyles}>
        <h1 className={titleStyles}>{title}</h1>
        {description !== undefined && (
          <p className={descriptionStyles}>{description}</p>
        )}
      </div>
    </div>
    {actions !== undefined && <div className={actionsStyles}>{actions}</div>}
  </div>
);

const rootStyles = css({
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  justifyContent: "space-between",
  md: { alignItems: "center", flexDirection: "row" },
});

const headingStyles = css({
  alignItems: "stretch",
  display: "flex",
  gap: 3,
  minInlineSize: 0,
});

// A short accent spine gives every page a spot of brand color and anchors the
// title. It stretches to the full height of the title + description.
const spineStyles = css({
  backgroundColor: "accent",
  borderRadius: "full",
  flexShrink: 0,
  inlineSize: 1,
});

const textStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 1,
  minInlineSize: 0,
});

const titleStyles = css({
  fontSize: "3xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lg: { fontSize: "4xl" },
});

const descriptionStyles = css({ color: "muted", fontSize: "sm" });

const actionsStyles = css({
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  gap: 2,
});
