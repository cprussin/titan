import {
  GET as getHandler,
  POST as postHandler,
} from "../../body-metrics/route";

/** The Android app's versioned mount of the web route (see DATA.md). */
export const GET = getHandler;
export const POST = postHandler;
