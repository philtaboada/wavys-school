'use client';

import AdminPageTQ from './client-tq';

interface AdminWrapperProps {
  searchParams: { [keys: string]: string | undefined };
}

export default function AdminWrapper({ searchParams }: AdminWrapperProps) {
  return <AdminPageTQ searchParams={searchParams} />;
} 