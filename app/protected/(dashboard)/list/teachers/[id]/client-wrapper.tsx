'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import TeacherDetailsTQ from './client-tq';
import { useState } from 'react';

interface TeacherDetailsWrapperProps {
  initialRole?: string;
  initialUserId?: string;
  teacherId: string;
}

export default function TeacherDetailsWrapper({ initialRole, initialUserId, teacherId }: TeacherDetailsWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TeacherDetailsTQ initialRole={initialRole} initialUserId={initialUserId} teacherId={teacherId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 