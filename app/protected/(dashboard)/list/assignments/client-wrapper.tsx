'use client';

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Loading from "../loading";

// Importar los tipos de SearchParams si es necesario (o definir inline)
interface SearchParams {
  page?: string;
  search?: string;
  classId?: string;
  teacherId?: string;
  [key: string]: string | undefined;
}

// Cargar el componente cliente de manera dinámica
const AssignmentsClientTQ = dynamic(() => import("./client-tq"), {
  ssr: false,
  loading: () => (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <Loading />
    </div>
  ),
});

interface ClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Añadir searchParams
}

export default function ClientWrapper({ 
  initialRole, 
  initialUserId, 
  searchParams 
}: ClientWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <Loading />
        </div>
      }
    >
      {/* Pasar searchParams a AssignmentsClientTQ */}
      <AssignmentsClientTQ 
        initialRole={initialRole} 
        initialUserId={initialUserId} 
        searchParams={searchParams}
      />
    </Suspense>
  );
} 