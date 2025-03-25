// import prisma from "@/lib/prisma"; // Eliminamos la importación de prisma
import { createClient } from "@/utils/supabase/server";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  const supabase = await createClient();
  
  // Reemplazamos la consulta de Prisma con Supabase
  const { data: attendance, error } = await supabase
    .from('Attendance')
    .select('*')
    .eq('studentId', id)
    .gte('date', new Date(new Date().getFullYear(), 0, 1).toISOString());
    
  if (error) {
    console.error('Error cargando asistencia:', error);
    return <div>Error cargando datos de asistencia</div>;
  }

  const totalDays = attendance?.length || 0;
  const presentDays = attendance?.filter((day) => day.present).length || 0;
  const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
  
  return (
    <div className="">
      <h1 className="text-xl font-semibold">{percentage || "-"}%</h1>
      <span className="text-sm text-gray-400">Asistencia</span>
    </div>
  );
};

export default StudentAttendanceCard;
