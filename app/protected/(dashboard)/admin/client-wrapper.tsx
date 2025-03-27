'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AdminPageTQ from './client-tq';
import { useState } from 'react';

interface AdminWrapperProps {
  searchParams: { [keys: string]: string | undefined };
}

export default function AdminWrapper({ searchParams }: AdminWrapperProps) {
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
      <AdminPageTQ searchParams={searchParams} />
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
} 