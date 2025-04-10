'use client';

import ParentClientTQ from './client-tq';

interface ParentClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ParentClientWrapper({ initialRole, initialUserId }: ParentClientWrapperProps) {
  return (
    <ParentClientTQ initialRole={initialRole} initialUserId={initialUserId} />
  );
} 