"use client";

import { Button } from "../ui";
import { StatusScreen } from "./StatusScreen";

type Props = {
  /** Re-renders the failed segment; wired to the boundary's `reset`. */
  reset: () => void;
};

/**
 * The client half of the error boundaries: a branded 500 splash offering a
 * retry (re-runs the failed render) and an escape hatch back to the dashboard.
 * Shared by both the segment-level `error.tsx` and the root `global-error.tsx`.
 */
export const ErrorScreen = ({ reset }: Props) => (
  <StatusScreen
    action={
      <>
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <Button href="/" variant="ghost">
          Back to dashboard
        </Button>
      </>
    }
    code="500"
    message="Something buckled on our end. Give it another go — if it keeps happening, it's on us, not you."
    title="Something went wrong"
  />
);
