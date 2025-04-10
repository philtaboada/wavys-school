'use client';

import StudentDetailsTQ from './client-tq';

interface StudentDetailsWrapperProps {
  initialRole?: string;
  initialUserId?: string;
  studentId: string;
}

export default function StudentDetailsWrapper({ initialRole, initialUserId, studentId }: StudentDetailsWrapperProps) {
  return <StudentDetailsTQ initialRole={initialRole} initialUserId={initialUserId} studentId={studentId} />;
} 