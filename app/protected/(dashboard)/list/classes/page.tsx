import { useUserRole } from "@/utils/hooks";
import ClassClientWrapper from "./client-wrapper";

export default async function ClassListPage() {
  const { role, userId } = await useUserRole();

  return <ClassClientWrapper initialRole={role} initialUserId={userId} />;
}
