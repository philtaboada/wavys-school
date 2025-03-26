'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ClassClientTQ from './client-tq';
import { useState } from 'react';

interface ClassClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ClassClientWrapper({ initialRole, initialUserId }: ClassClientWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ClassClientTQ initialRole={initialRole} initialUserId={initialUserId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 