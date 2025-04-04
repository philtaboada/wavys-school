'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Attendance, AttendanceListParams, AttendanceListResult } from '@/utils/types/attendance';
import { createClient } from '@/utils/supabase/client';

// Tipos para mutaciones
type CreateAttendanceParams = {
  date: string;
  present: boolean;
  studentId: string;
  lessonId?: number;
};

type UpdateAttendanceParams = {
  id: number;
  date?: string;
  present?: boolean;
  studentId?: string;
  lessonId?: number;
};

/**
 * Hook para verificar si un estudiante ya registró asistencia hoy
 */
export function useCheckDailyAttendance(studentId?: string) {
  return useSupabaseQuery<boolean>(
    ['attendance', 'daily-check', studentId],
    async (supabase) => {
      if (!studentId) return false;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('Attendance')
        .select('*', { count: 'exact' })
        .eq('studentId', studentId)
        .gte('date', `${today}T00:00:00`)
        .lte('date', `${today}T23:59:59`);

      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    { 
      enabled: !!studentId,
      staleTime: 1000 * 60 * 5, // 5 minutos de cache
      refetchOnWindowFocus: true
    }
  );
}

/**
 * Hook para obtener lista paginada de asistencias con filtros avanzados
 */
export function useAttendanceList(params: AttendanceListParams) {
  const { page, search, userId, role } = params;

  return useSupabaseQuery<AttendanceListResult>(
    ['attendance', 'list', page, search, role, userId],
    async (supabase) => {
      let filterLessonIds: number[] | null = null;
      let filterStudentIds: string[] | null = null;

      // Filtros dependientes del rol
      if (role === "teacher" && userId) {
        const { data: teacherLessons, error } = await supabase
          .from('Lesson')
          .select('id')
          .eq('teacherId', userId);
        
        if (error) throw error;
        filterLessonIds = teacherLessons?.map(lesson => lesson.id) ?? null;
      } 
      else if (role === "parent" && userId) {
        const { data: parentStudents, error } = await supabase
          .from('Student')
          .select('id')
          .eq('parentId', userId);
        
        if (error) throw error;
        filterStudentIds = parentStudents?.map(student => student.id) ?? null;
      }

      // Búsqueda por nombre de estudiante
      let searchStudentIds: string[] | null = null;
      if (search) {
        const searchLower = search.toLowerCase();
        const { data: studentsByName, error } = await supabase
          .from('Student')
          .select('id')
          .or(`name.ilike.%${searchLower}%,surname.ilike.%${searchLower}%`);
        
        if (error) throw error;
        searchStudentIds = studentsByName?.map(s => s.id) ?? null;
        if (!searchStudentIds?.length) return { data: [], count: 0 };
      }

      // Construir consulta base con relaciones
      let query = supabase
        .from('Attendance')
        .select(`
          id,
          date,
          present,
          studentId,
          lessonId,
          Student (id, name, surname),
          Lesson (id, name, Subject (id, name))
        `, { count: 'exact' });

      // Aplicar filtros
      if (filterLessonIds?.length) {
        query = query.in('lessonId', filterLessonIds);
      }
      
      if (role === "student" && userId) {
        query = query.eq('studentId', userId);
      }

      if (filterStudentIds?.length) {
        if (searchStudentIds?.length) {
          const intersection = filterStudentIds.filter(id => searchStudentIds?.includes(id));
          if (!intersection.length) return { data: [], count: 0 };
          query = query.in('studentId', intersection);
        } else {
          query = query.in('studentId', filterStudentIds);
        }
      } 
      else if (searchStudentIds?.length) {
        query = query.in('studentId', searchStudentIds);
      }

      // Paginación y ordenamiento
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd)
                  .order('date', { ascending: false });

      // Ejecutar consulta
      const { data, error, count } = await query;

      if (error) throw error;

      // Normalizar relaciones opcionales
      const resultData = (data as any[]).map(att => ({
        ...att,
        Student: att.Student ?? undefined,
        Lesson: att.Lesson ? {
          ...att.Lesson,
          Subject: att.Lesson.Subject ?? undefined
        } : undefined
      }));

      return {
        data: resultData as Attendance[],
        count: count ?? 0
      };
    },
    {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: true
    }
  );
}

/**
 * Hook para crear nueva asistencia
 */
export function useCreateAttendance() {
  return useSupabaseMutation<CreateAttendanceParams, { id: number }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Attendance')
        .insert(params)
        .select('id')
        .single();

      if (error) throw error;
      return data as { id: number };
    },
    {
      invalidateQueries: [
        ['attendance', 'list'],
        ['attendance', 'weekly'],
        ['attendance', 'daily-check']
      ],
      onError: (error) => {
        console.error("Error creating attendance:", error);
      }
    }
  );
}

/**
 * Hook para actualizar asistencia existente
 */
export function useUpdateAttendance() {
  return useSupabaseMutation<UpdateAttendanceParams, { id: number }>(
    async (supabase, params) => {
      const { id, ...rest } = params;
      const { data, error } = await supabase
        .from('Attendance')
        .update(rest)
        .eq('id', id)
        .select('id')
        .single();

      if (error) throw error;
      return data as { id: number };
    },
    {
      invalidateQueries: [
        ['attendance', 'list'],
        ['attendance', 'weekly'],
        ['attendance', 'daily-check']
      ],
      onError: (error) => {
        console.error("Error updating attendance:", error);
      }
    }
  );
}

/**
 * Hook para eliminar asistencia
 */
export function useDeleteAttendance() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      const { error } = await supabase
        .from('Attendance')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    {
      invalidateQueries: [
        ['attendance', 'list'], 
        ['attendance', 'weekly'],
        ['attendance', 'daily-check']
      ],
      onError: (error) => {
        console.error("Error deleting attendance:", error);
      }
    }
  );
}