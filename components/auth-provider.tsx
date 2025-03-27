'use client';

import { useUserAuth } from '@/utils/hooks/useUserAuth';
import { ReactNode } from 'react';

/**
 * Componente proveedor de autenticación que asegura que los datos del usuario
 * están disponibles en toda la aplicación a través de la caché de TanStack Query.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {ReactNode} props.children - Componentes hijos
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Utiliza el hook useUserAuth para gestionar la autenticación
  // Esto configurará todos los listeners y manejadores necesarios
  useUserAuth();
  
  // Simplemente renderiza los hijos, ya que todo el trabajo
  // de gestión de autenticación ocurre en el hook
  return <>{children}</>;
} 