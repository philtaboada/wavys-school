import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import { createClient } from "@/utils/supabase/server";

const AttendanceChartContainer = async () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Crear una copia de la fecha actual para evitar mutaciones
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysSinceMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const supabase = await createClient();
  
  // Consulta de asistencia con Supabase
  const { data: resData, error } = await supabase
    .from('attendance')
    .select('date, present')
    .gte('date', lastMonday.toISOString());

  // console.log(data)

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const attendanceMap: { [key: string]: { present: number; absent: number } } =
    {
      Mon: { present: 0, absent: 0 },
      Tue: { present: 0, absent: 0 },
      Wed: { present: 0, absent: 0 },
      Thu: { present: 0, absent: 0 },
      Fri: { present: 0, absent: 0 },
    };

  // Si hay datos y no hay error, procesar los registros de asistencia
  if (resData && !error) {
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

  const data = daysOfWeek.map((day) => ({
    name: day,
    present: attendanceMap[day].present,
    absent: attendanceMap[day].absent,
  }));

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Asistencia</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data}/>
    </div>
  );
};

export default AttendanceChartContainer;
