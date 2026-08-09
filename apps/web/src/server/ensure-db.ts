import { initialize } from "@titan/db/initialize";
import { db } from "../db";

let ready: Promise<void> | undefined;

/**
 * Ensure the database is up to date — schema applied and the bundled catalog
 * synced — exactly once per process. Subsequent calls await the same promise.
 * On failure the memo is cleared so a later request retries rather than being
 * stuck behind a rejected promise.
 */
export const ensureDbReady = (): Promise<void> => {
  ready ??= initialize(db).catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  return ready;
};
