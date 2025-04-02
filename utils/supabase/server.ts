import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Cliente con clave pública
export const createPublicClient = () => {
  return createServerComponentClient({
    cookies: async () => await cookies(), // Asegúrate de usar await para manejar cookies correctamente
  });
};

// Cliente con clave de servicio
export const createAdminClient = () => {
  return createServerComponentClient({
    cookies: async () => await cookies(), // Asegúrate de usar await para manejar cookies correctamente
  });
};