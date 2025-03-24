"use client";

import { ReactNode } from "react";
import { useSidebar } from "./SidebarToggle";

type MainContentProps = {
  children: ReactNode;
};

export default function MainContent({ children }: MainContentProps) {
  const { sidebarOpen } = useSidebar();
  
  return (
    <div className={`${sidebarOpen ? 'w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%]' : 'w-full'} 
      bg-[#F7F8FA] overflow-auto flex flex-col transition-all duration-300`}>
      {children}
    </div>
  );
} 