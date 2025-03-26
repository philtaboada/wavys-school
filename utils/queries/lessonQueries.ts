'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Lesson } from '@/utils/types/lesson';

// Tipos para los parámetros y resultados
export type LessonListParams = {
  page: number;
  search?: string;
  classId?: number;
  teacherId?: string;
  subjectId?: number;
};

export type LessonListResult = {
  data: Lesson[];
  count: number;
};

export type CreateLessonParams = {
  name?: string;
  classId: number;
  teacherId: string;
  subjectId: number;
};

export type UpdateLessonParams = {
  id: number;
  name?: string;
  classId?: number;
  teacherId?: string;
  subjectId?: number;
};

/**
 * Hook para obtener la lista de lecciones con filtrado y paginación
 */
export function useLessonList(params: LessonListParams & { userRole?: string; userId?: string }) {
  const { page, search, classId, teacherId, subjectId, userRole, userId } = params;
  
  return useSupabaseQuery<LessonListResult>(
    ['lesson', 'list', page, search, classId, teacherId, subjectId, userRole, userId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Lesson')
        .select(`
          *,
          Class(*),
          Teacher(*),
          Subject(*)
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        // Buscar por nombre de asignatura o profesor
        query = query.or(`Subject.name.ilike.%${search}%,Teacher.name.ilike.%${search}%,Teacher.surname.ilike.%${search}%`);
      }

      // Filtrar por clase
      if (classId) {
        query = query.eq('classId', classId);
      }

      // Filtrar por profesor
      if (teacherId) {
        query = query.eq('teacherId', teacherId);
      }

      // Filtrar por asignatura
      if (subjectId) {
        query = query.eq('subjectId', subjectId);
      }

      // Filtros específicos según el rol del usuario
      if (userRole && userRole !== 'admin' && userId) {
        if (userRole === 'teacher') {
          // Los profesores solo ven sus propias lecciones
          query = query.eq('teacherId', userId);
        } 
        else if (userRole === 'student') {
          // Los estudiantes ven las lecciones de su clase
          const { data: studentData } = await supabase
            .from('Student')
            .select('classId')
            .eq('id', userId)
            .single();
          
          if (studentData && studentData.classId) {
            query = query.eq('classId', studentData.classId);
          } else {
            return { data: [], count: 0 };
          }
        } 
        else if (userRole === 'parent') {
          // Los padres ven las lecciones de las clases de sus hijos
          const { data: parentStudents } = await supabase
            .from('Student')
            .select('classId')
            .eq('parentId', userId);
          
          if (parentStudents && parentStudents.length > 0) {
            const classIds = parentStudents.map(student => student.classId);
            query = query.in('classId', classIds);
          } else {
            return { data: [], count: 0 };
          }
        }
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('id', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de lecciones: ${error.message}`);
      }

      return { 
        data: data as Lesson[], 
        count: count || 0 
      };
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
}

/**
 * Función para crear una nueva lección
 */
export function useCreateLesson() {
  return useSupabaseMutation<CreateLessonParams, { id: number }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Lesson')
        .insert({
          name: params.name || `${params.subjectId}-${params.classId}-${params.teacherId}`,
          classId: params.classId,
          teacherId: params.teacherId,
          subjectId: params.subjectId
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear lección: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['lesson', 'list']],
      onSuccess: () => {
        console.log('Lección creada exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar una lección existente
 */
export function useUpdateLesson() {
  return useSupabaseMutation<UpdateLessonParams, { id: number }>(
    async (supabase, params) => {
      const { id, ...lessonData } = params;
      
      const { data, error } = await supabase
        .from('Lesson')
        .update(lessonData)
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar lección: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['lesson', 'list']],
      onSuccess: () => {
        console.log('Lección actualizada exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar una lección
 */
export function useDeleteLesson() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      // Verificar si hay exámenes o asistencias relacionadas
      const { count: examCount, error: examError } = await supabase
        .from('Exam')
        .select('id', { count: 'exact', head: true })
        .eq('lessonId', id);
      
      if (examError) {
        throw new Error(`Error al verificar exámenes: ${examError.message}`);
      }
      
      if (examCount && examCount > 0) {
        throw new Error(`No se puede eliminar la lección porque tiene ${examCount} exámenes asociados`);
      }
      
      const { count: attendanceCount, error: attendanceError } = await supabase
        .from('Attendance')
        .select('id', { count: 'exact', head: true })
        .eq('lessonId', id);
      
      if (attendanceError) {
        throw new Error(`Error al verificar asistencias: ${attendanceError.message}`);
      }
      
      if (attendanceCount && attendanceCount > 0) {
        throw new Error(`No se puede eliminar la lección porque tiene ${attendanceCount} registros de asistencia`);
      }
      
      // Si no hay relaciones, eliminar la lección
      const { error } = await supabase
        .from('Lesson')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar lección: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['lesson', 'list']],
      onSuccess: () => {
        console.log('Lección eliminada exitosamente');
      }
    }
  );
} 