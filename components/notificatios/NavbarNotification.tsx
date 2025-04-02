"use client";
import { useState } from "react";
import Image from "next/image";
import NotificationCenter from "./NotificationCenter";

const NavbarNotification = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative shadow-sm"
        onClick={() => setIsNotificationOpen(true)}
      >
        <Image src="/announcement.png" alt="" width={20} height={20} />
        <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-lamaSky text-white rounded-full text-xs">
          1
        </div>
      </div>
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </>
  );
};

export default NavbarNotification;
