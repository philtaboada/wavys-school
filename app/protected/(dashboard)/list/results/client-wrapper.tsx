'use client';

import ResultClientTQ from './client-tq';

interface ResultClientWrapperProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ResultClientWrapper({ initialRole, initialUserId }: ResultClientWrapperProps) {
  return (
    <ResultClientTQ initialRole={initialRole} initialUserId={initialUserId} />
  );
} 