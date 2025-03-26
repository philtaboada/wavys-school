'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Attendance, AttendanceListParams, AttendanceListResult } from '@/utils/types';
/**
 * Hook para obtener la lista de asistencias con filtrado y paginación
 */
export function useAttendanceList(params: AttendanceListParams) {
  const { page, search, userId, role } = params;
  
  return useSupabaseQuery<AttendanceListResult>(
    ['attendance', 'list', page, search, role, userId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Attendance')
        .select(`
          *,
          Student(*),
          Lesson(*, Subject(*))
        `, { count: 'exact' });

      // Aplicar filtros según el rol
      if (role === "teacher" && userId) {
        // Obtener lecciones impartidas por el profesor
        const { data: teacherLessons } = await supabase
          .from('Lesson')
          .select('id')
          .eq('teacherId', userId);
        
        if (teacherLessons && teacherLessons.length > 0) {
          const lessonIds = teacherLessons.map(lesson => lesson.id);
          query = query.in('lessonId', lessonIds);
        } else {
          return { data: [], count: 0 };
        }
      } else if (role === "student" && userId) {
        query = query.eq('studentId', userId);
      } else if (role === "parent" && userId) {
        // Obtener estudiantes del padre
        const { data: parentStudents } = await supabase
          .from('Student')
          .select('id')
          .eq('parentId', userId);
        
        if (parentStudents && parentStudents.length > 0) {
          const studentIds = parentStudents.map(student => student.id);
          query = query.in('studentId', studentIds);
        } else {
          return { data: [], count: 0 };
        }
      }

      // Aplicar filtros de búsqueda
      if (search) {
        // Aplicar la búsqueda por nombre de estudiante
        const { data: searchStudents } = await supabase
          .from('Student')
          .select('id')
          .ilike('name', `%${search}%`)
          .or(`surname.ilike.%${search}%`);
        
        if (searchStudents && searchStudents.length > 0) {
          const studentIds = searchStudents.map(student => student.id);
          query = query.in('studentId', studentIds);
        }
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('id', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de asistencia: ${error.message}`);
      }

      return { 
        data: data as Attendance[], 
        count: count || 0 
      };
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
}

// Tipos para mutaciones
type CreateAttendanceParams = {
  date: string;
  present: boolean;
  studentId: string;
  lessonId: number;
};

type UpdateAttendanceParams = {
  id: number;
  date?: string;
  present?: boolean;
  studentId?: string;
  lessonId?: number;
};

/**
 * Función para crear una nueva asistencia
 */
export function useCreateAttendance() {
  return useSupabaseMutation<CreateAttendanceParams, { id: number }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Attendance')
        .insert(params)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear asistencia: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['attendance', 'list']],
      onSuccess: () => {
        // Aquí podrías mostrar una notificación de éxito
        console.log('Asistencia creada exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar una asistencia existente
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
      
      if (error) {
        throw new Error(`Error al actualizar asistencia: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['attendance', 'list']],
      onSuccess: () => {
        // Aquí podrías mostrar una notificación de éxito
        console.log('Asistencia actualizada exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar una asistencia
 */
export function useDeleteAttendance() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      const { error } = await supabase
        .from('Attendance')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar asistencia: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['attendance', 'list']],
      onSuccess: () => {
        // Aquí podrías mostrar una notificación de éxito
        console.log('Asistencia eliminada exitosamente');
      }
    }
  );
} 