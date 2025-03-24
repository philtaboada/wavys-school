import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";



export default async function ProtectedPage() {
  //user supabase log
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log(user);

  // Redirige al panel de administrador
  //redirect("/protected/admin");
} 