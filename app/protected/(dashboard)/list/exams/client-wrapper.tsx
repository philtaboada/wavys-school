'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ExamClientTQ from './client-tq';
import { useState } from 'react';

interface ExamClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ExamClientWrapper({ initialRole, initialUserId }: ExamClientWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ExamClientTQ initialRole={initialRole} initialUserId={initialUserId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 