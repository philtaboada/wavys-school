'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import EventClientTQ from './client-tq';
import { useState } from 'react';

interface EventClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function EventClientWrapper({ initialRole, initialUserId }: EventClientWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <EventClientTQ initialRole={initialRole} initialUserId={initialUserId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 