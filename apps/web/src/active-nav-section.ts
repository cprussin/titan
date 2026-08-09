/**
 * Whether the primary-nav item for `href` is the active section at `pathname`.
 * Dashboard (`/`) matches only its exact path, since every route shares its `/`
 * prefix. A completed workout's recap lives at `/workout/<id>/complete` but
 * belongs to the History section, so that route lights History; the in-progress
 * workout at `/workout/<id>` belongs to no nav section and lights none. Every
 * other item matches its path prefix.
 */
export const isActiveNavSection = (href: string, pathname: string): boolean => {
  switch (href) {
    case "/": {
      return pathname === "/";
    }
    case "/history": {
      return (
        pathname.startsWith("/history") || isCompletedWorkoutPath(pathname)
      );
    }
    default: {
      return pathname.startsWith(href);
    }
  }
};

/** The recap route for a finished workout, `/workout/<id>/complete`. */
const isCompletedWorkoutPath = (pathname: string): boolean =>
  pathname.startsWith("/workout/") && pathname.endsWith("/complete");
