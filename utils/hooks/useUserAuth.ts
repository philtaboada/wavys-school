'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Profile } from '@/utils/types';

/**
 * Hook personalizado que gestiona la autenticación del usuario y 
 * almacena sus datos en la caché de TanStack Query.
 * 
 * Este hook detecta los cambios en el estado de autenticación y
 * actualiza automáticamente la caché con los datos del usuario.
 */
export function useUserAuth() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  useEffect(() => {
    // Obtener el usuario actual al cargar el componente
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Almacenar datos del usuario en caché
          queryClient.setQueryData(['currentUser'], user as User);
          
          // Opcionalmente, cargar datos adicionales del perfil si es necesario
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profile) {
            queryClient.setQueryData(['userProfile'], profile as Profile);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };

    fetchUserData();

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Actualizar la caché con los datos del usuario al iniciar sesión
          queryClient.setQueryData(['currentUser'], session.user as User);
          
          // Cargar datos adicionales del perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            queryClient.setQueryData(['userProfile'], profile as Profile);
          }
        } else if (event === 'SIGNED_OUT') {
          // Limpiar la caché cuando el usuario cierra sesión
          queryClient.removeQueries({ queryKey: ['currentUser'] });
          queryClient.removeQueries({ queryKey: ['userProfile'] });
        }
      }
    );

    // Limpiar la suscripción al desmontar el componente
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, supabase]);

  // Método para obtener el usuario actual desde la caché
  const getCurrentUser = () => {
    return queryClient.getQueryData(['currentUser']) as User | undefined;
  };

  // Obtener solo el id y role que esta en el user_metadata
  const getCurrentUserMetadata = () => {
    const user = getCurrentUser();
    return {
      id: user?.id,
      role: user?.user_metadata?.role
    };
  };

  // Método para obtener el perfil del usuario desde la caché
  const getUserProfile = () => {
    return queryClient.getQueryData(['userProfile']) as Profile | undefined;
  };

  return {
    getCurrentUser,
    getUserProfile,
    getCurrentUserMetadata
  };
} 