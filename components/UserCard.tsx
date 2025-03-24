import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

const UserCard = async ({
  type,
}: {
  type: "Admin" | "Teacher" | "Student" | "Parent";
}) => {
  const supabase = await createClient();
  
  // Determinar el nombre de la tabla en singular
  const tableName = type === 'Admin' ? 'Admin' : type;

  // Realizar consulta de conteo en Supabase según el tipo de usuario
  // Usar el servicio sin RLS para poder contar los registros
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  
  // Registrar error si existe
  if (error) {
    console.error(`Error al consultar ${tableName}:`, error.message);
    
    // Verificar si el error está relacionado con permisos o tabla inexistente
    if (error.message.includes("permission denied") || error.message.includes("does not exist")) {
      console.log("Error de permisos o tabla inexistente. Verificar RLS y esquema.");
    }
  }
  
  // Valor predeterminado en caso de error
  const data = error ? 0 : count || 0;

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2025/26
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{data}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
    </div>
  );
};

export default UserCard;
