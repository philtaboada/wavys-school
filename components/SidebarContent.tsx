"use client";

import { ReactNode } from "react";
import { useSidebar } from "./SidebarToggle";

type SidebarContentProps = {
  children: ReactNode;
};

export default function SidebarContent({ children }: SidebarContentProps) {
  const { sidebarOpen } = useSidebar();
  
  return (
    <div className={`${sidebarOpen ? 'w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%]' : 'w-0'} 
      transition-all duration-300 overflow-hidden bg-white h-screen`}>
      <div className="p-4 h-full overflow-y-auto pb-20">
        {children}
      </div>
    </div>
  );
} 