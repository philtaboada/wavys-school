import { useUserRole } from "@/utils/hooks";
import TeacherDetailsWrapper from "./client-wrapper";

interface TeacherPageProps {
  params: { id: string };
}

export default async function SingleTeacherPage({ params }: TeacherPageProps) {
  // Esperamos a los parámetros antes de acceder a sus propiedades
  const { id } = await params;
  const { role, userId } = await useUserRole();

  return <TeacherDetailsWrapper initialRole={role} initialUserId={userId} teacherId={id} />;
}
