'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AnnouncementClientTQ from './client-tq';
import { useState } from 'react';

interface AnnouncementClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function AnnouncementClientWrapper({ initialRole, initialUserId }: AnnouncementClientWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AnnouncementClientTQ initialRole={initialRole} initialUserId={initialUserId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 