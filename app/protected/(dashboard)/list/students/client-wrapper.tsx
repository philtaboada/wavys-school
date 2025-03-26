'use client';

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Loading from "../loading";

// Definir explícitamente las props para el componente dinámico
interface StudentsClientProps {
  initialRole?: string;
  initialUserId?: string;
}

// Especificar el tipo genérico en dynamic
const StudentsClientTQ = dynamic<StudentsClientProps>(() => import("./client-tq"), {
  ssr: false,
  loading: () => (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <p className="text-center py-8">Cargando interfaz de estudiantes con TanStack Query...</p>
    </div>
  ),
});

interface ClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ClientWrapper({ initialRole, initialUserId }: ClientWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <Loading />
        </div>
      }
    >
      <StudentsClientTQ initialRole={initialRole} initialUserId={initialUserId} />
    </Suspense>
  );
} 