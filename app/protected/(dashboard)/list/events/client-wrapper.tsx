'use client';

import EventClientTQ from './client-tq';

interface EventClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function EventClientWrapper({ initialRole, initialUserId }: EventClientWrapperProps) {
  return <EventClientTQ initialRole={initialRole} initialUserId={initialUserId} />;
} 