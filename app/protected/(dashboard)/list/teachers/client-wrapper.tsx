'use client';

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Definir explícitamente las props para el componente dinámico
interface TeachersClientProps {
  initialRole?: string;
  initialUserId?: string;
}

// Especificar el tipo genérico en dynamic
const TeachersClientTQ = dynamic<TeachersClientProps>(() => import("./client-tq"), {
  ssr: false,
  loading: () => (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <p className="text-center py-8">Cargando interfaz de profesores con TanStack Query...</p>
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
          <p className="text-center py-8">Cargando datos de profesores...</p>
        </div>
      }
    >
      <TeachersClientTQ initialRole={initialRole} initialUserId={initialUserId} />
    </Suspense>
  );
} 