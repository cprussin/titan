import { GoogleLogoIcon } from "@phosphor-icons/react/dist/ssr/GoogleLogo";
import { css } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";
import { Button } from "../ui";

type Props = {
  /** The `error` query param carried back from a failed callback, if any. */
  error?: string | undefined;
};

/** The sign-in screen: brand, a Google sign-in button, and — when the last
 *  attempt failed — the reason. The button is a plain link to the authorize
 *  route, which redirects on to Google. */
export const SignInPanel = ({ error }: Props) => (
  <div className={panelStyles}>
    <h1 className={titleStyles}>Titan</h1>
    <p className={subtitleStyles}>Sign in to your training.</p>
    <Button
      beforeIcon={<GoogleLogoIcon size={20} weight="bold" />}
      href="/api/auth/google"
      variant="accent"
    >
      Sign in with Google
    </Button>
    {error !== undefined && <p className={errorStyles}>{messageFor(error)}</p>}
  </div>
);

const messageFor = (error: string): string => {
  switch (error) {
    case "forbidden":
      return "That Google account isn't allowed to sign in.";
    default:
      return "Sign-in failed. Please try again.";
  }
};

const panelStyles = vstack({
  alignItems: "stretch",
  gap: 3,
  inlineSize: "100%",
  marginBlockStart: 24,
  marginInline: "auto",
  maxInlineSize: "24rem",
});

const titleStyles = css({
  fontFamily: "condensed",
  fontSize: "4xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "condensed",
  textTransform: "uppercase",
});

const subtitleStyles = css({ color: "muted" });

const errorStyles = css({ color: "danger", fontSize: "sm" });
