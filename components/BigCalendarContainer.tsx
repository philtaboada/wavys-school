import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const supabase = await createClient();
  
  const { data: lessons, error } = await supabase
    .from('Lesson')
    .select('*')
    .eq(type === "teacherId" ? 'teacherId' : 'classId', id);
    
  if (error) {
    console.error('Error cargando lecciones:', error);
    return <div>Error cargando el horario</div>;
  }

  // Convertimos los datos al formato esperado por el calendario
  const data = (lessons || []).map((lesson) => ({
    title: lesson.name,
    start: new Date(lesson.startTime),
    end: new Date(lesson.endTime),
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
