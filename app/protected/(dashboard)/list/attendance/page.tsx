'use client'

import { useUserRole } from "@/utils/hooks";
import ClientWrapper from "./client-wrapper";
import { useUserAuth } from "@/utils/hooks/useUserAuth";

export default function AttendanceTQPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    search?: string;
    [key: string]: string | undefined;
  }>;
}) {
  // Obtenemos la información del usuario actual usando nuestro hook
  //const { userId, role } = await useUserRole();
  const { getCurrentUserMetadata } = useUserAuth()
  const { role, id } = getCurrentUserMetadata()
  
  return <ClientWrapper initialRole={role} initialUserId={id} />;
} 