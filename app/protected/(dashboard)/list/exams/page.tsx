import { useUserRole } from "@/utils/hooks";
import ExamClientWrapper from "./client-wrapper";

export default async function ExamListPage() {
  const { role, userId } = await useUserRole();

  return <ExamClientWrapper initialRole={role} initialUserId={userId} />;
}

  