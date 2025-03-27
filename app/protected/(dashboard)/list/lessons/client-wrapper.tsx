'use client';

import LessonClientTQ from './client-tq';

interface LessonClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function LessonClientWrapper({ initialRole, initialUserId }: LessonClientWrapperProps) {
  return <LessonClientTQ initialRole={initialRole} initialUserId={initialUserId} />;
} 