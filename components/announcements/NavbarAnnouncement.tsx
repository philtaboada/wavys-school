"use client";
import { useState } from "react";
import Image from "next/image";
import AnnouncementCenter from "./AnnouncementCenter";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useMarkAnnouncementAsRead } from "@/hooks/useMarkAnnouncementAsRead";

const NavbarAnnouncement = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { announcements, unreadCount, loading, error } = useAnnouncements();
  const { markAsRead } = useMarkAnnouncementAsRead();

  return (
    <div className="relative">
      <div 
        className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-sm"
        onClick={() => setIsNotificationOpen(true)}
      >
        <Image src="/announcement.png" alt="" width={20} height={20} />
        {unreadCount > 0 && (
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-lamaSky text-white rounded-full text-xs">
            {unreadCount}
          </div>
        )}
      </div>
      <AnnouncementCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)}
        announcements={announcements}
        onMarkAsRead={markAsRead}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default NavbarAnnouncement;
