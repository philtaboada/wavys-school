'use client';

import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';
import Image from "next/image";

interface UserCardTQProps {
  type: "Admin" | "Teacher" | "Student" | "Parent";
}

export default function UserCardTQ({ type }: UserCardTQProps) {
  // Determinar el nombre de la tabla en singular
  const tableName = type === 'Admin' ? 'Admin' : type;

  // Usar TanStack Query para el conteo
  const { data: count, isLoading, error } = useSupabaseQuery<number>(
    ['user_count', tableName],
    async (supabase) => {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Error al consultar ${tableName}: ${error.message}`);
      }
      
      return count || 0;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );

  // Mostrar un estado de carga
  if (isLoading) {
    return (
      <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
            2025/26
          </span>
          <Image src="/more.png" alt="" width={20} height={20} />
        </div>
        <div className="h-8 w-16 bg-gray-200 animate-pulse my-4 rounded"></div>
        <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
      </div>
    );
  }

  // Mostrar un estado de error
  if (error) {
    return (
      <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
            Error
          </span>
          <Image src="/more.png" alt="" width={20} height={20} />
        </div>
        <h1 className="text-2xl font-semibold my-4">0</h1>
        <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
      </div>
    );
  }

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2025/26
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{count}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
    </div>
  );
} 