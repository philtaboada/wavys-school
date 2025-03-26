'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import SubjectClientTQ from './client-tq';
import { useState } from 'react';

interface SubjectClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function SubjectClientWrapper({ initialRole, initialUserId }: SubjectClientWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SubjectClientTQ initialRole={initialRole} initialUserId={initialUserId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 