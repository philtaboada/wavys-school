"use client";

import { Announcement } from '@/utils/types/announcement';

interface AnnouncementCardProps {
  announcement: Announcement;
  activeTab: 'all' | 'unread';
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const getTypeIcon = (type: Announcement['type']) => {
  switch (type) {
    case 'announcement':
      return '📝';
    case 'alert':
      return '⚠️';
    default:
      return '📌';
  }
};

const AnnouncementCard = ({ announcement, activeTab, onMarkAsRead, onDelete }: AnnouncementCardProps) => {
  return (
    <div
      className={`p-4 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
        !announcement.read ? 'bg-gray-50 dark:bg-gray-700/30' : ''
      }`}
    >
      <div className="flex gap-4">
        <div className="relative">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-base lg:text-lg">
            {getTypeIcon(announcement.type)}
          </div>
          {!announcement.read && activeTab === 'all' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-800 dark:bg-gray-100 rounded-full border-2 border-white dark:border-gray-800" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white flex items-center gap-2">
                {announcement.title}
                {!announcement.read && activeTab === 'all' && (
                  <span className="hidden lg:inline-block text-xs font-normal text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-1 md:px-2 py-0.5 rounded-full">
                    No leído
                  </span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] lg:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {
                  announcement.date ? new Intl.DateTimeFormat("es-ES").format(new Date(announcement.date)) : "-"
                }
              </span>
              <div className="flex gap-1">
                {!announcement.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(announcement.id);
                    }}
                    className="p-1 text-xs text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="Marcar como leída"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(announcement.id);
                  }}
                  className="p-1.5 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Eliminar notificación"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {announcement.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;