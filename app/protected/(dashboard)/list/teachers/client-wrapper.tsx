'use client';

import TeacherClientTQ from './client-tq';

interface TeacherClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function TeacherClientWrapper({ initialRole, initialUserId }: TeacherClientWrapperProps) {
  return <TeacherClientTQ initialRole={initialRole} initialUserId={initialUserId} />;
} 