import { createPublicClient } from '@/utils/supabase/server';

/**
 * Hook para obtener el usuario actual y su rol desde Supabase.
 * Extrae la lógica común presente en múltiples componentes page.tsx.
 * 
 * @returns {Promise<{userId: string | undefined, role: string | undefined, user: any}>} - El ID del usuario, su rol y el objeto de usuario completo
 */
export async function useUserRole() {
  const supabase = await createPublicClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Obtener el rol desde los metadatos del usuario
  const role = (user?.user_metadata as { role?: string })?.role;
  const userId = user?.id;

  return {
    userId,
    role,
    user
  };
}

export default useUserRole; 