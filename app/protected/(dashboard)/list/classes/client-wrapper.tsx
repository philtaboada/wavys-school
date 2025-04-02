'use client';

import ClassClientTQ from './client-tq';

// Definir tipo para searchParams
interface SearchParams {
  page?: string;
  search?: string;
  gradeId?: string;
  [key: string]: string | undefined;
}

interface ClassClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Añadir prop
}

export default function ClassClientWrapper({ 
  initialRole, 
  initialUserId, 
  searchParams // Recibir prop
}: ClassClientWrapperProps) {
  return (
      <ClassClientTQ 
        initialRole={initialRole} 
        initialUserId={initialUserId} 
        searchParams={searchParams} // Pasar prop
      />
  );
} 