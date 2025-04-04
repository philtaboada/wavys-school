'use client';

import TeacherClientTQ from './client-tq';

// Definir tipo para searchParams
interface SearchParams {
  page?: string;
  search?: string;
  // Añadir otros filtros si aplican (ej. subjectId)
  [key: string]: string | undefined;
}

interface TeacherClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Añadir prop
}

export default function TeacherClientWrapper({
  initialRole, 
  initialUserId, 
  searchParams // Recibir prop
}: TeacherClientWrapperProps) {
  // Pasar initialRole, initialUserId y searchParams a TeacherClientTQ
  return <TeacherClientTQ 
            initialRole={initialRole} 
            initialUserId={initialUserId} 
            searchParams={searchParams} // Pasar prop
         />;
} 