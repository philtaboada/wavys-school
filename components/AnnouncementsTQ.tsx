'use client';

import { useAnnouncements } from '@/hooks/useAnnouncements';
import AnnouncementHomeCard from './announcements/AnnouncementHomeCard';
import Link from 'next/link';

const AnnouncementsTQ = () => {
  const { announcements, loading: isLoading, error } = useAnnouncements();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-gray-100 dark:bg-gray-700 animate-pulse h-24 rounded-md"></div>
          <div className="bg-gray-100 dark:bg-gray-700 animate-pulse h-24 rounded-md"></div>
          <div className="bg-gray-100 dark:bg-gray-700 animate-pulse h-24 rounded-md"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <div className="text-sm text-red-500 mt-2">Error al cargar anuncios</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-white">Anuncios</h1>
        <Link href="/protected/list/announcements" className="text-xs text-gray-400 dark:text-gray-200">Ver todos</Link>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {announcements && announcements.slice(0, 3).map((announcement, idx) => (
          <AnnouncementHomeCard key={announcement.id} announcement={announcement} idx={idx} />
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsTQ; 