"use client";

import { useState, ReactNode } from "react";

type SidebarToggleProps = {
  children: ReactNode;
};

export default function SidebarToggle({ children }: SidebarToggleProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Pasamos las propiedades al contexto
  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Añadimos un contexto para compartir el estado
import { createContext, useContext } from "react";

type SidebarContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar debe usarse dentro de un SidebarToggle");
  }
  return context;
} 