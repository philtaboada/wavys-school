'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import LessonClientTQ from './client-tq';
import { useState } from 'react';

interface LessonClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function LessonClientWrapper({ initialRole, initialUserId }: LessonClientWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LessonClientTQ initialRole={initialRole} initialUserId={initialUserId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 