'use client';

import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';

interface LessonSchedule {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

const useLessonSchedule = (type: "teacherId" | "classId", id: string | number) => {
  return useSupabaseQuery<CalendarEvent[]>(
    ['lesson_schedule', type, id],
    async (supabase) => {
      const { data: lessons, error } = await supabase
        .from('Lesson')
        .select('*')
        .eq(type === "teacherId" ? 'teacherId' : 'classId', id);
        
      if (error) {
        throw new Error(`Error cargando lecciones: ${error.message}`);
      }
      
      // Convertimos los datos al formato esperado por el calendario
      const data = (lessons as LessonSchedule[] || []).map((lesson) => ({
        title: lesson.name,
        start: new Date(lesson.startTime),
        end: new Date(lesson.endTime),
      }));
    
      return adjustScheduleToCurrentWeek(data);
    },
    {
      staleTime: 1000 * 60 * 5 // 5 minutos
    }
  );
};

const BigCalendarContainerTQ = ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const { data: schedule, isLoading, error } = useLessonSchedule(type, id);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center">Cargando horario...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error cargando el horario: {(error as Error).message}</div>;
  }

  return (
    <div className="">
      <BigCalendar data={schedule || []} />
    </div>
  );
};

export default BigCalendarContainerTQ; 