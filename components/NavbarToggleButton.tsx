"use client";

import { useSidebar } from "./SidebarToggle";

export default function NavbarToggleButton() {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  
  return (
    <button 
      onClick={toggleSidebar}
      className="p-2 rounded-md hover:bg-gray-200 transition-colors mr-2"
      aria-label={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
    >
      {sidebarOpen ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      )}
    </button>
  );
} 