'use client';

import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';

interface AttendanceData {
  name: string;
  present: number;
  absent: number;
}

export default function AttendanceChartContainerTQ() {
  // Utilizamos TanStack Query para obtener los datos
  const { data, isLoading, error } = useSupabaseQuery<AttendanceData[]>(
    ['weekly_attendance'],
    async (supabase) => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      // Crear una copia de la fecha actual para evitar mutaciones
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - daysSinceMonday);
      lastMonday.setHours(0, 0, 0, 0);

      // Consulta de asistencia con Supabase
      const lastMondayDate = lastMonday.toISOString().split('T')[0]; // YYYY-MM-DD

      const { data: resData, error } = await supabase
        .from('Attendance')
        .select('date, present, studentId')
        .gte('date', lastMondayDate); // Compara desde ese día 00:00:00

      if (error) {
        throw new Error(`Error al obtener datos de asistencia: ${error.message}`);
      }

      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

      const attendanceMap: { [key: string]: { present: number; absent: number } } = {
        Mon: { present: 0, absent: 0 },
        Tue: { present: 0, absent: 0 },
        Wed: { present: 0, absent: 0 },
        Thu: { present: 0, absent: 0 },
        Fri: { present: 0, absent: 0 },
      };

      // Procesar los registros de asistencia
      if (resData) {
        resData.forEach((item) => {
          const itemDate = new Date(item.date);
          const dayOfWeek = itemDate.getDay();

          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const dayName = daysOfWeek[dayOfWeek - 1];

            if (item.present) {
              attendanceMap[dayName].present += 1;
            } else {
              attendanceMap[dayName].absent += 1;
            }
          }
        });
      }

      return daysOfWeek.map((day) => ({
        name: day,
        present: attendanceMap[day].present,
        absent: attendanceMap[day].absent,
      }));
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 h-full">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Asistencia de la semana</h1>
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-gray-300 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Mostrar estado de error
  if (error || !data) {
    return (
      <div className="bg-white rounded-lg p-4 h-full">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Asistencia de la semana</h1>
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </div>
        <div className="h-[300px] flex items-center justify-center text-red-500">
          Error al cargar datos de asistencia
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Asistencia de la semana</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data} />
    </div>
  );
} 