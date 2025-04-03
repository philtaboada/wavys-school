"use client";
import { useState, useRef, useEffect } from "react";
import { Notification } from '@/types/notifications';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (ids: number[]) => void;
  loading: boolean;
  error: string | null;
}

const NotificationCenter = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAsRead,
  loading,
  error 
}: NotificationCenterProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = filteredNotifications.slice(0, 6);

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'announcement':
        return '📝';
      case 'alert':
        return '⚠️';
      default:
        return '📌';
    }
  };

  return (
    <div className="absolute right-0 top-9 z-50">
      <div
        className="fixed inset-0 bg-black/20"
        onClick={onClose}
      />

      <div className="relative">
        <div
          className="relative bg-white dark:bg-gray-800 w-[500px] shadow-2xl rounded-xl h-[600px] overflow-hidden flex flex-col transform transition-all duration-300 ease-out origin-top"
          style={{
            transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
          }}
        >
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100">Notificaciones</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-gray-700 dark:text-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full transition-colors ${activeTab === 'all'
                    ? 'bg-gray-700 dark:bg-gray-100 text-white dark:text-gray-700'
                    : 'text-gray-500/80 dark:text-white/80 hover:text-gray-600 dark:hover:text-gray-400'
                  }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${activeTab === 'unread'
                    ? 'bg-gray-700 dark:bg-gray-100 text-white dark:text-gray-700'
                    : 'text-gray-500/80 dark:text-white/80 hover:text-gray-600 dark:hover:text-gray-400'
                  }`}
              >
                No leídas
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-gray-700 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            {activeTab === 'unread' && unreadCount > 0 && (
              <button
                onClick={() => {
                  const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
                  onMarkAsRead(unreadIds);
                  setActiveTab('all');
                }}
                className="ml-auto px-3 py-1.5 text-xs underline text-gray-700 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 rounded-full transition-colors cursor-pointer"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-300/50 cursor-pointer transition-colors ${!notification.read ? 'bg-gray-200/50 dark:bg-gray-100/30' : ''
                }`}
            >
              <div className="flex gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                    {getTypeIcon(notification.type)}
                  </div>
                  {!notification.read && activeTab === 'all' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-800 dark:bg-gray-100 rounded-full border-2 border-white dark:border-gray-800" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {notification.title}
                        {!notification.read && activeTab === 'all' && (
                          <span className="text-xs font-normal text-gray-600 dark:text-gray-400 bg-gray-300 dark:bg-gray-100 px-2 py-0.5 rounded-full">
                            No leído
                          </span>
                        )}
                      </h3>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredNotifications.length > 6 && (
          <div className="p-4 flex justify-center border-t bg-white dark:bg-gray-800 shadow-inner rounded-bl-3xl">
            <button
              onClick={() => {
                // TODO: Add navigation to notifications page
                console.log('ir a donde estaran todos los anuncios');
              }}
              className="px-4 text-sm text-gray-600 dark:text-gray-400 underline transition-colors cursor-pointer"
            >
              Ver Todas las Notificaciones
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
