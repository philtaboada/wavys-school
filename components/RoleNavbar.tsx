'use server'
import { createClient } from "@/utils/supabase/server";

const RoleNavbar = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col">
    <span className="text-xs leading-3 font-medium">{user?.user_metadata.full_name}</span>
    <span className="text-[10px] text-gray-500 text-right">
      {user?.user_metadata.role as string}
    </span>
  </div>
  )
}

export default RoleNavbar