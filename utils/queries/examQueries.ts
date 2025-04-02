'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Exam, ExamListParams, ExamListResult, CreateExamParams, UpdateExamParams } from '@/utils/types/exam';
import { createClient } from '@/utils/supabase/client'; // Importar para filtros

/**
 * Hook para obtener la lista de exámenes con filtrado y paginación optimizado
 */
export function useExamList(params: ExamListParams) {
  const { page, search, lessonId, subjectId, teacherId, classId, startDate, endDate } = params;

  return useSupabaseQuery<ExamListResult>(
    ['exam', 'list', page, search, lessonId, subjectId, teacherId, classId, startDate, endDate],
    async (supabase) => {

      let filterLessonIds: number[] | null = null;

      // **Manejo de filtros dependientes (antes de construir la query principal)**
      if (subjectId) {
        const { data: lessons } = await supabase
          .from('Lesson')
          .select('id')
          .eq('subjectId', subjectId);
        if (lessons && lessons.length > 0) {
          filterLessonIds = lessons.map(lesson => lesson.id);
        } else {
          return { data: [], count: 0 }; // No hay lecciones para esa asignatura
        }
      }

      if (classId) {
         const { data: lessons } = await supabase
           .from('Lesson')
           .select('id')
           .eq('classId', classId);
         if (lessons && lessons.length > 0) {
            const lessonIdsFromClass = lessons.map(lesson => lesson.id);
             // Si ya teníamos filtro por asignatura, interseccionar
             if (filterLessonIds) {
                 filterLessonIds = filterLessonIds.filter(id => lessonIdsFromClass.includes(id));
                 if (filterLessonIds.length === 0) return { data: [], count: 0 };
             } else {
                 filterLessonIds = lessonIdsFromClass;
             }
         } else {
           return { data: [], count: 0 }; // No hay lecciones para esa clase
         }
      }

      // Construir la consulta base con relaciones
      let query = supabase
        .from('Exam')
        .select(`
          id,
          title,
          startTime,
          endTime,
          lessonId,
          lesson: Lesson (
            id, name, teacherId, classId,
            Subject (id, name),
            Teacher (id, name, surname),
            Class (id, name)
         )
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda directa
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      // Aplicar filtros explícitos
      if (lessonId) {
        query = query.eq('lessonId', lessonId);
      }
      if (teacherId) {
         // Filtrar por ID del profesor en la lección anidada
        query = query.eq('Lesson.teacherId', teacherId);
      }

      // Aplicar filtros de IDs de lección derivados (subject/class)
      if (filterLessonIds !== null && !lessonId) { // Aplicar solo si no hay filtro explícito de lessonId
         query = query.in('lessonId', filterLessonIds);
      }

      // Filtrar por fecha
      if (startDate) {
        query = query.gte('startTime', startDate);
      }
      if (endDate) {
        // Ajustar para incluir todo el día de endDate
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('startTime', endOfDay.toISOString()); // Usar startTime <= endOfDay
      }

      // Paginación y orden
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd).order('startTime', { ascending: false });

      // Ejecutar consulta - Debería devolver un array compatible con Exam[] ahora
      const { data, error, count } = await query.returns<Exam[]>();

      if (error) {
        console.error("Error fetching exams:", error);
        throw new Error(`Error al obtener datos de exámenes: ${error.message}`);
      }

      // Mapear solo para convertir strings de fecha a objetos Date
      // y asegurar estructura de relaciones anidadas
      const resultData = data.map(exam => {
           const startTime = new Date(exam.startTime);
           // Asegurarse que endTime no sea null antes de crear Date
           const endTime = exam.endTime ? new Date(exam.endTime) : new Date(); // Usar new Date() como fallback si endTime debe ser Date

           return {
             ...exam,
             startTime,
             endTime,
             // Asegurar que las sub-relaciones (en minúscula) null se vuelvan undefined
             lesson: exam.lesson ? {
                 ...exam.lesson,
                 subject: exam.lesson.subject ?? undefined,
                 teacher: exam.lesson.teacher ?? undefined,
                 class: exam.lesson.class ?? undefined
             } : undefined
           };
      });

      return {
        data: resultData,
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
        const { data, error } = await supabase
          .from('Exam')
          .insert({
              title: params.title,
              // CreateExamParams define startTime/endTime como string
              startTime: params.startTime,
              endTime: params.endTime,
              lessonId: params.lessonId
          })
          .select('id')
          .single();
        if (error) {
           console.error("Error creating exam:", error);
           throw new Error(`Error al crear examen: ${error.message}`);
        }
        return data as { id: number };
    },
    {
      invalidateQueries: [['exam', 'list']],
       onError: (error) => {
         console.error("Mutation error (Create Exam):", error);
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
       // UpdateExamParams define startTime/endTime como string opcionales
        const updateData: Partial<Omit<UpdateExamParams, 'id'>> = { ...examData };
        
        // No se necesita conversión a ISO si ya son strings

        const { data, error } = await supabase
          .from('Exam')
          .update(updateData)
          .eq('id', id)
          .select('id')
          .single();
         if (error) {
           console.error("Error updating exam:", error);
           throw new Error(`Error al actualizar examen: ${error.message}`);
        }
         return data as { id: number };
    },
    {
      invalidateQueries: [['exam', 'list']],
       onError: (error) => {
         console.error("Mutation error (Update Exam):", error);
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
       // Aquí podrían ir validaciones, chequeos de permisos o RPC si se necesita verificar dependencias (Resultados)
       /*
        CREATE OR REPLACE FUNCTION delete_exam_if_unused(exam_id_to_delete int)
        RETURNS void LANGUAGE plpgsql AS $$
        BEGIN
          IF EXISTS (SELECT 1 FROM public."Result" WHERE "examId" = exam_id_to_delete) THEN
             RAISE EXCEPTION 'EXAM_HAS_RESULTS';
          END IF;
          DELETE FROM public."Exam" WHERE id = exam_id_to_delete;
        END;
        $$;
       */
        // const { error } = await supabase.rpc('delete_exam_if_unused', { exam_id_to_delete: id });

        const { error } = await supabase
          .from('Exam')
          .delete()
          .eq('id', id);

        if (error) {
           /* if (error.message.includes('EXAM_HAS_RESULTS')) {
               throw new Error('EXAM_HAS_RESULTS');
           } */
           console.error("Error deleting exam:", error);
           throw new Error(`Error al eliminar examen: ${error.message}`);
        }
    },
    {
      invalidateQueries: [['exam', 'list']],
       onError: (error) => {
         console.error("Mutation error (Delete Exam):", error);
      }
    }
  );
}