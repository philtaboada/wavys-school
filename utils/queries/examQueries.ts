'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Exam, ExamListParams, ExamListResult, CreateExamParams, UpdateExamParams } from '@/utils/types/exam';

/**
 * Hook para obtener la lista de exámenes con filtrado y paginación
 */
export function useExamList(params: ExamListParams) {
  const { page, search, lessonId, subjectId, teacherId, classId, startDate, endDate } = params;
  
  return useSupabaseQuery<ExamListResult>(
    ['exam', 'list', page, search, lessonId, subjectId, teacherId, classId, startDate, endDate],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Exam')
        .select(`
          *,
          Lesson(id, name, teacherId, Subject(id, name))
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      // Filtrar por lección
      if (lessonId) {
        query = query.eq('lessonId', lessonId);
      }

      // Filtrar por profesor
      if (teacherId) {
        query = query.eq('Lesson.teacherId', teacherId);
      }

      // Filtrar por asignatura
      if (subjectId) {
        // Obtenemos primero las lecciones de esa asignatura
        const { data: lessons } = await supabase
          .from('Lesson')
          .select('id')
          .eq('subjectId', subjectId);

        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map(lesson => lesson.id);
          query = query.in('lessonId', lessonIds);
        } else {
          return { data: [], count: 0 };
        }
      }

      // Filtrar por clase
      if (classId) {
        // Obtenemos primero las lecciones para esa clase
        const { data: lessons } = await supabase
          .from('Lesson')
          .select('id')
          .eq('classId', classId);

        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map(lesson => lesson.id);
          query = query.in('lessonId', lessonIds);
        } else {
          return { data: [], count: 0 };
        }
      }

      // Filtrar por fecha de inicio
      if (startDate) {
        query = query.gte('startTime', startDate);
      }

      // Filtrar por fecha de fin
      if (endDate) {
        query = query.lte('endTime', endDate);
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('startTime', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de exámenes: ${error.message}`);
      }

      return { 
        data: data as Exam[], 
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
 * Función para crear un nuevo examen
 */
export function useCreateExam() {
  return useSupabaseMutation<CreateExamParams, { id: number }>(
    async (supabase, params) => {
      // Opcional: Verificar permisos del usuario para esta lección
      // const { data: { user } } = await supabase.auth.getUser();
      // if (user?.user_metadata.role === "teacher") {
      //   const { data: lesson, error: lessonError } = await supabase
      //     .from('lesson')
      //     .select('id')
      //     .eq('id', params.lessonId)
      //     .eq('teacherId', user.id)
      //     .single();
      //     
      //   if (lessonError || !lesson) {
      //     throw new Error("No tienes permisos para esta lección");
      //   }
      // }

      const { data, error } = await supabase
        .from('Exam')
        .insert({
          title: params.title,
          startTime: params.startTime,
          endTime: params.endTime,
          lessonId: params.lessonId
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear examen: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['exam', 'list']],
      onSuccess: () => {
        console.log('Examen creado exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar un examen existente
 */
export function useUpdateExam() {
  return useSupabaseMutation<UpdateExamParams, { id: number }>(
    async (supabase, params) => {
      const { id, ...examData } = params;
      
      // Opcional: Verificar permisos del usuario
      // const { data: { user } } = await supabase.auth.getUser();
      // if (user?.user_metadata.role === "teacher") {
      //   const { data: exam, error: examError } = await supabase
      //     .from('Exam')
      //     .select('Lesson(teacherId)')
      //     .eq('id', id)
      //     .single();
      //     
      //   if (examError || !exam || exam.Lesson.teacherId !== user.id) {
      //     throw new Error("No tienes permisos para modificar este examen");
      //   }
      // }
      
      const { data, error } = await supabase
        .from('Exam')
        .update(examData)
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar examen: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['exam', 'list']],
      onSuccess: () => {
        console.log('Examen actualizado exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar un examen
 */
export function useDeleteExam() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      // Opcional: Verificar permisos del usuario
      // const { data: { user } } = await supabase.auth.getUser();
      // if (user?.user_metadata.role === "teacher") {
      //   const { data: exam, error: examError } = await supabase
      //     .from('Exam')
      //     .select('Lesson(teacherId)')
      //     .eq('id', id)
      //     .single();
      //     
      //   if (examError || !exam || exam.Lesson.teacherId !== user.id) {
      //     throw new Error("No tienes permisos para eliminar este examen");
      //   }
      // }
      
      // Verificar si hay calificaciones asociadas antes de eliminar (opcional)
      // const { count, error: countError } = await supabase
      //   .from('Grade')
      //   .select('id', { count: 'exact', head: true })
      //   .eq('examId', id);
      // 
      // if (countError) {
      //   throw new Error(`Error al verificar calificaciones: ${countError.message}`);
      // }
      // 
      // if (count && count > 0) {
      //   throw new Error(`No se puede eliminar el examen porque tiene ${count} calificaciones asociadas`);
      // }
      
      const { error } = await supabase
        .from('Exam')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar examen: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['exam', 'list']],
      onSuccess: () => {
        console.log('Examen eliminado exitosamente');
      }
    }
  );
}