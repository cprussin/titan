import { getConnection } from "@titan/db/external-connections";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import type { Metadata } from "next";
import { requireAuth } from "../../../auth/session";
import { SettingsContent } from "../../../components/SettingsContent";
import { db } from "../../../db";
import { USER_ID } from "../../../user";

export const metadata: Metadata = {
  description: "Manage your account, appearance, integrations, and data.",
  title: "Settings",
};

const SettingsPage = async () => {
  const [user, connection, externals] = await Promise.all([
    requireAuth(),
    getConnection(db, USER_ID, "concept2"),
    listExternalWorkouts(db, USER_ID, 100),
  ]);

  return (
    <SettingsContent
      load={{
        isLoading: false,
        value: {
          accountEmail: user.email,
          concept2Connected: connection !== undefined,
          concept2WorkoutCount: externals.length,
        },
      }}
    />
  );
};

export default SettingsPage;
