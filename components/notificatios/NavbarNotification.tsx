"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import NotificationCenter from "./NotificationCenter";
import { NotificationState } from "@/types/notifications";

const initialState: NotificationState = {
  notifications: [
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
  ],
  unreadCount: 0,
  loading: false,
  error: null
};

const NavbarNotification = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationState, setNotificationState] = useState<NotificationState>(initialState);

  // Update unread count
  useEffect(() => {
    const unreadCount = notificationState.notifications.filter(n => !n.read).length;
    setNotificationState(prev => ({ ...prev, unreadCount }));
  }, [notificationState.notifications]);

  // Mark notifications as read
  const markAsRead = (ids: number[]) => {
    setNotificationState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        ids.includes(notification.id) ? { ...notification, read: true } : notification
      )
    }));
  };

  // TBD
  const fetchNotifications = async () => {
    try {
      setNotificationState(prev => ({ ...prev, loading: true }));
      // TODO: Add API call
    } catch (error) {
      setNotificationState(prev => ({ 
        ...prev, 
        error: 'Error al cargar las notificaciones', 
        loading: false 
      }));
    }
  };

  return (
    <div className="relative">
      <div 
        className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-sm"
        onClick={() => setIsNotificationOpen(true)}
      >
        <Image src="/announcement.png" alt="" width={20} height={20} />
        {notificationState.unreadCount > 0 && (
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-lamaSky text-white rounded-full text-xs">
            {notificationState.unreadCount}
          </div>
        )}
      </div>
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)}
        notifications={notificationState.notifications}
        onMarkAsRead={markAsRead}
        loading={notificationState.loading}
        error={notificationState.error}
      />
    </div>
  );
};

export default NavbarNotification;
