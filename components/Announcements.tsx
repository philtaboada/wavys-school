'use client';

import { useAnnouncements } from '@/hooks/useAnnouncements';

const Announcements = () => {
  const { announcements: data, loading } = useAnnouncements();

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-gray-100 animate-pulse h-24 rounded-md"></div>
          <div className="bg-gray-100 animate-pulse h-24 rounded-md"></div>
          <div className="bg-gray-100 animate-pulse h-24 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <span className="text-xs text-gray-400">Ver todos</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data && data[0] && (
          <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[0].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(data[0].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[0].description}</p>
          </div>
        )}
        {data && data[1] && (
          <div className="bg-lamaPurpleLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[1].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(data[1].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[1].description}</p>
          </div>
        )}
        {data && data[2] && (
          <div className="bg-lamaYellowLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[2].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(data[2].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[2].description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
