'use client';

import ClassClientTQ from './client-tq';

interface ClassClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ClassClientWrapper({ initialRole, initialUserId }: ClassClientWrapperProps) {
  return <ClassClientTQ initialRole={initialRole} initialUserId={initialUserId} />;
} 