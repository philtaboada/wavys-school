import { useUserRole } from "@/utils/hooks";
import LessonClientWrapper from "./client-wrapper";

export default async function LessonListPage() {
  const { role, userId } = await useUserRole();

  return <LessonClientWrapper initialRole={role} initialUserId={userId} />;
}
