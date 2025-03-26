'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ResultClientTQ from './client-tq';
import { useState } from 'react';

interface ResultClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ResultClientWrapper({ initialRole, initialUserId }: ResultClientWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ResultClientTQ initialRole={initialRole} initialUserId={initialUserId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 