import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { center, hstack, vstack } from "../../styled-system/patterns";
import { TitanMark } from "./TitanMark";

type Props = {
  /** Buttons or links offering the way out (retry, go home, …). */
  action: ReactNode;
  /** The HTTP-style status shown large above the title, e.g. `"404"`. */
  code: string;
  message: string;
  title: string;
};

/**
 * The branded full-viewport splash shared by the 404 and error boundaries: the
 * Titan mark, an oversized status code, a heading, a muted message, and a slot
 * for recovery actions. Purely presentational, so it renders in both server
 * (not-found) and client (error boundary) contexts.
 */
export const StatusScreen = ({ action, code, message, title }: Props) => (
  <main className={mainStyles}>
    <div className={panelStyles}>
      <TitanMark size={64} />
      <span className={codeStyles}>{code}</span>
      <h1 className={titleStyles}>{title}</h1>
      <p className={messageStyles}>{message}</p>
      <div className={actionStyles}>{action}</div>
    </div>
  </main>
);

const mainStyles = center({ minBlockSize: "100dvh", padding: 6 });

const panelStyles = vstack({
  gap: 3,
  maxInlineSize: "28rem",
  textAlign: "center",
});

// The status code is the visual anchor: the condensed brand face at a large cap
// height, dimmed so the heading below it carries the message.
const codeStyles = css({
  color: "muted",
  fontFamily: "condensed",
  fontSize: "7xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "condensed",
  marginBlockStart: 2,
});

const titleStyles = css({ fontSize: "2xl", fontWeight: "semibold" });

const messageStyles = css({ color: "muted" });

const actionStyles = hstack({ gap: 3, marginBlockStart: 3 });
