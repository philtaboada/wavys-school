import { useUserRole } from "@/utils/hooks";
import ClientWrapper from "./client-wrapper";

export default async function TeacherListPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    subjectId?: string;
    [key: string]: string | undefined;
  }>;
}) {
  // Obtenemos la información del usuario actual usando nuestro hook
  const { userId, role } = await useUserRole();
  
  return <ClientWrapper initialRole={role} initialUserId={userId} />;
}
