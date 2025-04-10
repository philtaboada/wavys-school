'use client';

import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';
import { queryKeys } from '@/utils/queries/queryKeys';

interface AttendanceData {
  name: string;
  present: number;
  absent: number;
}

interface RawAttendanceRecord {
  date: string;
  present: boolean;
  studentId: string;
}

export default function AttendanceChartContainerTQ() {
  // Obtenemos la fecha del último lunes para estructurar la query key
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Crear una copia de la fecha actual para evitar mutaciones
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysSinceMonday);
  lastMonday.setHours(0, 0, 0, 0);
  const lastMondayDate = lastMonday.toISOString().split('T')[0]; // YYYY-MM-DD

  // Utilizamos TanStack Query con clave estructurada de queryKeys
  const { data, isLoading, error } = useSupabaseQuery<RawAttendanceRecord[], AttendanceData[]>(
    queryKeys.attendance.weekly(lastMondayDate),
    async (supabase) => {
      // Consulta optimizada con límite
      const { data, error } = await supabase
        .from('Attendance')
        .select('date, present, studentId')
        .gte('date', lastMondayDate)
        .limit(1000); // Limitar a 1000 registros como máximo

      if (error) {
        throw error;
      }

      return data || [];
    },
    {
      staleTime: 1000 * 60 * 15, // 15 minutos para datos que pueden cambiar durante el día
      gcTime: 1000 * 60 * 60, // 1 hora
      // Transformar los datos crudos en el formato que necesita el gráfico
      select: (rawData) => {
        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const attendanceMap: { [key: string]: { present: number; absent: number } } = {
          Mon: { present: 0, absent: 0 },
          Tue: { present: 0, absent: 0 },
          Wed: { present: 0, absent: 0 },
          Thu: { present: 0, absent: 0 },
          Fri: { present: 0, absent: 0 },
        };

        // Procesar los registros de asistencia
        if (rawData.length > 0) {
          rawData.forEach((item) => {
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
      retry: (failureCount) => failureCount < 2, // Solo reintentar una vez
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