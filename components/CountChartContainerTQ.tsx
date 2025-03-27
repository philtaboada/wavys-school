'use client';

import Image from "next/image";
import CountChart from "./CountChart";
import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';

interface StudentCounts {
  boys: number;
  girls: number;
}

export default function CountChartContainerTQ() {
  // Utilizamos TanStack Query para obtener los datos
  const { data, isLoading, error } = useSupabaseQuery<StudentCounts>(
    ['student_counts'],
    async (supabase) => {
      // Obtener conteo de estudiantes masculinos
      const { count: boys, error: boysError } = await supabase
        .from('Student')
        .select('id', { count: 'exact', head: true })
        .eq('sex', 'MALE');

      if (boysError) {
        throw new Error(`Error al obtener estudiantes masculinos: ${boysError.message}`);
      }

      // Obtener conteo de estudiantes femeninas
      const { count: girls, error: girlsError } = await supabase
        .from('Student')
        .select('id', { count: 'exact', head: true })
        .eq('sex', 'FEMALE');

      if (girlsError) {
        throw new Error(`Error al obtener estudiantes femeninas: ${girlsError.message}`);
      }

      return {
        boys: boys || 0,
        girls: girls || 0
      };
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Estudiantes</h1>
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-gray-300 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Mostrar estado de error
  if (error || !data) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Estudiantes</h1>
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </div>
        <div className="h-[200px] flex items-center justify-center text-red-500">
          Error al cargar datos
        </div>
      </div>
    );
  }

  const { boys, girls } = data;
  const total = boys + girls || 1; // Evitar división por cero

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Estudiantes</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <CountChart boys={boys} girls={girls} />
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaSky rounded-full" />
          <h1 className="font-bold">{boys}</h1>
          <h2 className="text-xs text-gray-300">
            Hombres ({Math.round((boys / total) * 100)}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaYellow rounded-full" />
          <h1 className="font-bold">{girls}</h1>
          <h2 className="text-xs text-gray-300">
            Mujeres ({Math.round((girls / total) * 100)}%)
          </h2>
        </div>
      </div>
    </div>
  );
} 