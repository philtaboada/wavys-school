'use client';

import AnnouncementClientTQ from './client-tq';

interface AnnouncementClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function AnnouncementClientWrapper({ initialRole, initialUserId }: AnnouncementClientWrapperProps) {
  return <AnnouncementClientTQ initialRole={initialRole} initialUserId={initialUserId} />;
} 