import { useUserRole } from "@/utils/hooks/useUserRole";
import StudentDetailsWrapper from "./client-wrapper";

interface StudentPageProps {
  params: { id: string };
}

export default async function StudentPage({ params }: StudentPageProps) {
  const { role, userId } = await useUserRole();
  const { id } = await params;

  return (
    <StudentDetailsWrapper
      initialUserId={userId}
      initialRole={role}
      studentId={id}
    />
  );
}
