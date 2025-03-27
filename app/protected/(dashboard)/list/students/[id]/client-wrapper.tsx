'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import StudentDetailsTQ from './client-tq';
import { useState } from 'react';

interface StudentDetailsWrapperProps {
  initialRole?: string;
  initialUserId?: string;
  studentId: string;
}

export default function StudentDetailsWrapper({ initialRole, initialUserId, studentId }: StudentDetailsWrapperProps) {
  // Crear una instancia de QueryClient para cada componente
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <StudentDetailsTQ 
        initialRole={initialRole} 
        initialUserId={initialUserId} 
        studentId={studentId}
      />
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
} 