'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ParentClientTQ from './client-tq';
import { useState } from 'react';

interface ParentClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ParentClientWrapper({ initialRole, initialUserId }: ParentClientWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ParentClientTQ initialRole={initialRole} initialUserId={initialUserId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 