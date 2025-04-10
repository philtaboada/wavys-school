import { useUserRole } from "@/utils/hooks";
import EventClientWrapper from "./client-wrapper";

export default async function EventListPage() {
  const { role, userId } = await useUserRole();

  return <EventClientWrapper initialRole={role} initialUserId={userId} />;
}
