import type { Metadata } from "next";
import { requireAuth } from "../../../auth/session";
import { SettingsContent } from "../../../components/SettingsContent";
import { db } from "../../../db";
import { loadSettings } from "../../../server/load-settings";
import { USER_ID } from "../../../user";

export const metadata: Metadata = {
  description: "Manage your account, appearance, integrations, and data.",
  title: "Settings",
};

const SettingsPage = async () => {
  const user = await requireAuth();
  const data = await loadSettings(db, USER_ID, user.email);
  return <SettingsContent load={{ isLoading: false, value: data }} />;
};

export default SettingsPage;
