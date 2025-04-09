'use client';

import { useQueryClient } from '@tanstack/react-query';
import { User, Profile } from '@/utils/types';

/**
 * Hook para acceder a los datos del usuario actual
 * almacenados en la caché de TanStack Query.
 * 
 * Este hook proporciona un acceso fácil a los datos del usuario
 * que fueron almacenados por el hook useUserAuth.
 * 
 * @param initialRole - Rol inicial como fallback
 * @param initialUserId - ID de usuario inicial como fallback
 */
export function useUser(initialRole?: string, initialUserId?: string) {
  const queryClient = useQueryClient();

  try {
    // Obtener el usuario actual desde la caché
    const user = queryClient.getQueryData(['currentUser']) as User | undefined;

    // Obtener el perfil del usuario desde la caché
    const profile = queryClient.getQueryData(['userProfile']) as Profile | undefined;

    // Si no hay usuario en la caché pero hay valores iniciales, crear un usuario básico
    const fallbackUser = !user && initialUserId ? {
      id: initialUserId,
      user_metadata: { role: initialRole }
    } as User : undefined;

    // Verificar si el usuario está autenticado (ya sea de caché o fallback)
    const isAuthenticated = !!(user || fallbackUser);

    // Elegir usuario de caché o fallback
    const finalUser = user || fallbackUser;

    // Logs para depuración
    if (process.env.NODE_ENV === 'development') {
      console.log("useUser hook:", {
        cachedUser: user,
        fallbackUser,
        initialRole,
        initialUserId,
        isAuthenticated
      });
    }

    return {
      user: finalUser || null,
      profile: profile || null,
      isAuthenticated,
      cachedUser: user,
      fallbackUser,
      initialRole,
      initialUserId
    };
  } catch (error) {
    console.error("Error en useUser hook:", error);
    // En caso de error, devolver valores por defecto
    return {
      user: initialUserId ? {
        id: initialUserId,
        user_metadata: { role: initialRole }
      } as User : null,
      profile: null,
      isAuthenticated: !!initialUserId
    };
  }
} 