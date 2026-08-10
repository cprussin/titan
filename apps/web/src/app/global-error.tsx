"use client";

import "./globals.css";
import { useEffect } from "react";
import { css } from "../../styled-system/css";
import { ErrorScreen } from "../components/ErrorScreen";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * The root error boundary: catches errors thrown by the root layout itself,
 * where no `<html>`/`<body>` shell exists yet. It therefore renders its own
 * document, pulling in the global stylesheet so the branded screen is styled
 * even when the layout never mounted.
 */
const GlobalError = ({ error, reset }: Props) => {
  useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: surface the boundary-caught error
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className={bodyStyles}>
        <ErrorScreen reset={reset} />
      </body>
    </html>
  );
};

export default GlobalError;

const bodyStyles = css({
  backgroundColor: "background",
  color: "foreground",
  minBlockSize: "100dvh",
});
