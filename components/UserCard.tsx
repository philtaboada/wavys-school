import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student" | "parent";
}) => {
  const supabase = await createClient();
  
  // Determinar el nombre de la tabla
  const tableName = type === 'admin' ? 'admins' : `${type}s`;
  
  console.log(`Intentando consultar tabla: ${tableName}`);
  
  // Realizar consulta de conteo en Supabase según el tipo de usuario
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  
  // Registrar error si existe
  if (error) {
    console.error(`Error al consultar ${tableName}:`, error.message);
  }
  
  // Intento alternativo para verificar si la tabla existe
  const { data: testData, error: testError } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
    
  if (testError) {
    console.error(`Error en consulta de prueba a ${tableName}:`, testError.message);
  } else {
    console.log(`Consulta de prueba a ${tableName} exitosa. Datos:`, testData);
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
