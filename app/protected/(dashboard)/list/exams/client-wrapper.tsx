'use client';

import ExamClientTQ from './client-tq';

interface ExamClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ExamClientWrapper({ initialRole, initialUserId }: ExamClientWrapperProps) {
  return <ExamClientTQ initialRole={initialRole} initialUserId={initialUserId} />;
} 