import type { Metadata } from "next";
import { requireAuth } from "../../../auth/session";
import { ProgramsContent } from "../../../components/ProgramsContent";
import { db } from "../../../db";
import { loadPrograms } from "../../../server/load-programs";
import { todayIso } from "../../../server/local-date";
import { USER_ID } from "../../../user";

export const metadata: Metadata = {
  description: "Browse training programs and choose your active block.",
  title: "Programs",
};

const ProgramsPage = async () => {
  await requireAuth();
  const data = await loadPrograms(db, USER_ID, await todayIso());
  return <ProgramsContent load={{ isLoading: false, value: data }} />;
};

export default ProgramsPage;
