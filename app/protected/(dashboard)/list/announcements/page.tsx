import { useUserRole } from "@/utils/hooks";
import AnnouncementClientWrapper from "./client-wrapper";

export default async function AnnouncementListPage() {
  const { role, userId } = await useUserRole();

  return <AnnouncementClientWrapper initialRole={role} initialUserId={userId} />;
}
