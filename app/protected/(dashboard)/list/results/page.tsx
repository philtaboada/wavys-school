import { useUserRole } from "@/utils/hooks/useUserRole";
import ResultClientWrapper from "./client-wrapper";

export default async function ResultListPage() {
  const { role, userId } = await useUserRole();
  
  return <ResultClientWrapper initialRole={role} initialUserId={userId} />;
} 