import { useUserRole } from "@/utils/hooks";
import SubjectClientWrapper from "./client-wrapper";

export default async function SubjectListPage() {
  const { role, userId } = await useUserRole();

  return <SubjectClientWrapper initialRole={role} initialUserId={userId} />;
}
