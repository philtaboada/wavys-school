'use client';

import SubjectClientTQ from './client-tq';

interface SubjectClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function SubjectClientWrapper({ initialRole, initialUserId }: SubjectClientWrapperProps) {
  return <SubjectClientTQ initialRole={initialRole} initialUserId={initialUserId} />;
} 