'use client';

import { useQueryClient } from '@tanstack/react-query';
import { User, Profile } from '@/utils/types';

/**
 * Hook para acceder a los datos del usuario actual
 * almacenados en la caché de TanStack Query.
 * 
 * Este hook proporciona un acceso fácil a los datos del usuario
 * que fueron almacenados por el hook useUserAuth.
 */
export function useUser() {
  const queryClient = useQueryClient();

  // Obtener el usuario actual desde la caché
  const user = queryClient.getQueryData(['currentUser']) as User | undefined;
  
  // Obtener el perfil del usuario desde la caché
  const profile = queryClient.getQueryData(['userProfile']) as Profile | undefined;
  
  // Verificar si el usuario está autenticado
  const isAuthenticated = !!user;

  return {
    user: user || null,
    profile: profile || null,
    isAuthenticated
  };
} 