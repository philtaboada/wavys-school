'use client';

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Loading from "../loading";

// Definir tipo SearchParams
interface SearchParams {
  page?: string;
  search?: string;
  classId?: string;
  gradeId?: string;
  parentId?: string;
  [key: string]: string | undefined;
}

// Definir props para el componente dinámico
interface StudentsClientProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Añadir searchParams aquí también
}

// Cargar dinámicamente asegurando pasar props
const StudentsClientTQ = dynamic<StudentsClientProps>(() => import("./client-tq"), {
  ssr: false,
  loading: () => (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <Loading /> 
    </div>
  ),
});

// Definir props para el wrapper
interface ClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Añadir searchParams aquí
}

export default function ClientWrapper({ 
  initialRole, 
  initialUserId, 
  searchParams // Recibir
}: ClientWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <Loading />
        </div>
      }
    >
      {/* Pasar todas las props necesarias */}
      <StudentsClientTQ 
        initialRole={initialRole} 
        initialUserId={initialUserId} 
        searchParams={searchParams} // Pasar
      />
    </Suspense>
  );
} 