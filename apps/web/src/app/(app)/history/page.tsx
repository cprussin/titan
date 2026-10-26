import type { Metadata } from "next";
import { requireAuth } from "../../../auth/session";
import { HistoryContent } from "../../../components/HistoryContent";
import { db } from "../../../db";
import { loadHistory } from "../../../server/load-history";
import { USER_ID } from "../../../user";

export const metadata: Metadata = {
  description: "Every training session you've logged, most recent first.",
  title: "History",
};

const HistoryPage = async () => {
  await requireAuth();
  const data = await loadHistory(db, USER_ID);
  return <HistoryContent load={{ isLoading: false, value: data }} />;
};

export default HistoryPage;
