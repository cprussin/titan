import type { Metadata } from "next";
import { StatusScreen } from "../components/StatusScreen";
import { Button } from "../ui";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * The app-wide 404 boundary: rendered for unmatched URLs and any `notFound()`
 * that bubbles to the root. Chrome-free, matching the root layout, with a way
 * back to the dashboard.
 */
const NotFound = () => (
  <StatusScreen
    action={
      <Button href="/" variant="primary">
        Back to dashboard
      </Button>
    }
    code="404"
    message="That page has racked its last rep — the link may be broken or the page may have moved."
    title="Page not found"
  />
);

export default NotFound;
