'use client';

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Loading from "../loading";

// Cargar el componente cliente de manera dinámica
const AttendanceClientTQ = dynamic(() => import("./client-tq"), {
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
      <AttendanceClientTQ initialRole={initialRole} initialUserId={initialUserId} />
    </Suspense>
  );
} 