'use client';

import TeacherDetailsTQ from './client-tq';

interface TeacherDetailsWrapperProps {
  initialRole?: string;
  initialUserId?: string;
  teacherId: string;
}

export default function TeacherDetailsWrapper({ initialRole, initialUserId, teacherId }: TeacherDetailsWrapperProps) {
  return <TeacherDetailsTQ initialRole={initialRole} initialUserId={initialUserId} teacherId={teacherId} />;
} 