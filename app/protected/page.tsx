import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  // Crear cliente de Supabase
  const supabase = await createClient();
  
  // Verificar si el usuario está autenticado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Si no hay usuario autenticado, redirigir a inicio de sesión
    redirect("/sign-in");
  }
  
  // Obtener el rol del usuario desde sus metadatos
  const role = (user.user_metadata as { role?: string })?.role;
  
  if (!role) {
    // Si no tiene rol definido, mostrar error o redirigir a página por defecto
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Error de Acceso</h1>
        <p>No se ha podido determinar tu rol en el sistema. Por favor, contacta al administrador.</p>
      </div>
    );
  }
  
  // Redirigir al usuario a la ruta correspondiente según su rol
  redirect(`/protected/${role}`);
} 