"use client";
import { useState, useRef } from "react";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'announcement' | 'alert';
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Nueva tarea asignada",
      message: "Se te ha asignado una nueva tarea en Matemáticas que requiere tu atención inmediata.",
      time: "Hace 5 minutos",
      read: false,
      type: 'announcement',
    },
    {
      id: 2,
      title: "Mensaje del tutor",
      message: "¿Podemos agendar una reunión para discutir tu progreso?",
      time: "Hace 2 horas",
      read: true,
      type: 'announcement',
    },
    {
      id: 3,
      title: "Alerta de entrega",
      message: "El plazo para entregar el proyecto de Ciencias vence mañana",
      time: "Hace 3 horas",
      read: false,
      type: 'alert'
    },
    {
      id: 4,
      title: "Tarea completada",
      message: "¡Felicidades! Has completado la tarea de Matemáticas.",
      time: "Hace 1 hora",
      read: true,
      type: 'announcement'
    },
    {
      id: 5,
      title: "Mensaje del tutor",
      message: "¿Podemos agendar una reunión para discutir tu progreso?",
      time: "Hace 2 horas",
      read: true,
      type: 'announcement',
    },
    {
      id: 6,
      title: "Tarea completada",
      message: "¡Felicidades! Has completado la tarea de Matemáticas.",
      time: "Hace 1 hora",
      read: false,
      type: 'announcement'
    },
    {
      id: 7,
      title: "Mensaje del tutor",
      message: "¿Podemos agendar una reunión para discutir tu progreso?",
      time: "Hace 2 horas",
      read: false,
      type: 'announcement',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

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
    <div className="fixed inset-0 z-50 flex items-start justify-end ">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm "
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-md shadow-2xl rounded-bl-3xl h-[50vh] overflow-hidden flex flex-col">
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
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === 'all' 
                    ? 'bg-gray-700 dark:bg-gray-100 text-white dark:text-gray-700' 
                    : 'text-gray-500/80 dark:text-white/80 hover:text-gray-600 dark:hover:text-gray-400'
                }`}
              >
                Todas
              </button>
              <button 
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
                  activeTab === 'unread' 
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
                  setNotifications(notifications.map(n => ({ ...n, read: true })));
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
        <div 
          ref={notificationsRef}
          className="overflow-y-auto flex-1"
        >
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-300/50 cursor-pointer transition-colors ${
                !notification.read ? 'bg-gray-200/50 dark:bg-gray-100/30' : ''
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
  );
};

export default NotificationCenter;
