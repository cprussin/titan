import { getWorkoutSession } from "@titan/db/workout-sessions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "../../../../../auth/session";
import { CompleteContent } from "../../../../../components/CompleteContent";
import { db } from "../../../../../db";
import { loadComplete } from "../../../../../server/load-complete";
import { USER_ID } from "../../../../../user";

export const metadata: Metadata = {
  description: "Your session summary and what changes next time.",
  title: "Workout complete",
};

const CompletePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await requireAuth();
  const { id } = await params;
  const session = await getWorkoutSession(db, id);
  if (session === undefined) {
    notFound();
  } else {
    const data = await loadComplete(db, USER_ID, session);
    return <CompleteContent load={{ isLoading: false, value: data }} />;
  }
};

export default CompletePage;
