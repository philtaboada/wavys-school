import { useUserRole } from "@/utils/hooks";
import ParentClientWrapper from "./client-wrapper";

export default async function ParentListPage() {
  const { role, userId } = await useUserRole();

  return <ParentClientWrapper initialRole={role} initialUserId={userId} />;
}
