"use client";

import { useEffect } from "react";
import { ErrorScreen } from "../components/ErrorScreen";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * The segment-level error boundary: catches errors thrown while rendering any
 * page under the root layout and surfaces the branded 500 screen. Renders
 * inside the root `<html>`/`<body>`, so it needs no document shell of its own.
 */
const ErrorBoundary = ({ error, reset }: Props) => {
  useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: surface the boundary-caught error
    console.error(error);
  }, [error]);

  return <ErrorScreen reset={reset} />;
};

export default ErrorBoundary;
