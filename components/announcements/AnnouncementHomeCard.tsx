"use client";

import { Announcement } from "@/utils/types/announcement";

interface AnnouncementHomeCardProps {
  announcement: Announcement;
  idx: number;
}

const AnnouncementHomeCard = ({ announcement, idx }: AnnouncementHomeCardProps) => {

  return (
    <div className={`rounded-lg p-4 ${idx % 2 === 0 ? 'bg-lamaSkyLight dark:bg-lamaSky/30' : 'bg-lamaPurpleLight dark:bg-lamaPurple/30'}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-gray-800 dark:text-gray-100">{announcement.title}</h2>
        <span className="text-xs text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-700 rounded-md px-2 py-1">
          {new Intl.DateTimeFormat("es-ES").format(new Date(announcement.date))}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{announcement.description}</p>
    </div>
  );
};

export default AnnouncementHomeCard;
