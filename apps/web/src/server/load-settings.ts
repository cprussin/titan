import type { Db } from "@titan/db/client";
import { getConnection } from "@titan/db/external-connections";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import type { SettingsData } from "../components/SettingsContent";

/** The settings screen's account and integration state. Shared by the settings
 *  page and the Android app's `/api/v1/settings`. */
export const loadSettings = async (
  db: Db,
  userId: string,
  accountEmail: string,
): Promise<SettingsData> => {
  const [connection, externals] = await Promise.all([
    getConnection(db, userId, "concept2"),
    listExternalWorkouts(db, userId, 100),
  ]);
  return {
    accountEmail,
    concept2Connected: connection !== undefined,
    concept2WorkoutCount: externals.length,
  };
};
