'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Assignment, AssignmentListParams, AssignmentListResult } from '@/utils/types/assignment';
import { createClient } from '@/utils/supabase/client'; // Importar para filtros

/**
 * Hook para obtener la lista de asignaciones con filtrado y paginación optimizado
 */
export function useAssignmentList(params: AssignmentListParams) {
  const { page, search, classId, teacherId, userId, role } = params;

  return useSupabaseQuery<AssignmentListResult>(
    ['assignment', 'list', page, search, classId, teacherId, role, userId],
    async (supabase) => {

      let filterLessonIds: number[] | null = null;

      // **Manejo de filtros dependientes (antes de construir la query principal)**
      // Prioridad: Filtros explícitos (classId, teacherId) > Filtros de rol

      if (classId) {
        const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).eq('classId', classId);
        filterLessonIds = lessons?.map(l => l.id) || [];
        if (filterLessonIds.length === 0) return { data: [], count: 0 };
      }

      if (teacherId) {
        const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).eq('teacherId', teacherId);
        const lessonIdsFromTeacher = lessons?.map(l => l.id) || [];
        if (filterLessonIds) { // Interseccionar si ya había filtro por clase
          filterLessonIds = filterLessonIds.filter(id => lessonIdsFromTeacher.includes(id));
        } else {
          filterLessonIds = lessonIdsFromTeacher;
        }
        if (filterLessonIds.length === 0) return { data: [], count: 0 };
      }

      // Aplicar filtros de rol solo si no hubo filtros explícitos de clase/profesor
      if (filterLessonIds === null && role && role !== 'admin' && userId) {
          if (role === 'teacher') {
              const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).eq('teacherId', userId);
              filterLessonIds = lessons?.map(l => l.id) || [];
              if (filterLessonIds.length === 0) return { data: [], count: 0 };
          } else if (role === 'student') {
              const { data: studentData } = await supabase.from('Student').select('classId').eq('id', userId).maybeSingle();
              if (studentData?.classId) {
                  const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).eq('classId', studentData.classId);
                  filterLessonIds = lessons?.map(l => l.id) || [];
                  if (filterLessonIds.length === 0) return { data: [], count: 0 };
              } else {
                  return { data: [], count: 0 };
              }
          } else if (role === 'parent') {
              const { data: parentStudents } = await supabase.from('Student').select('classId').eq('parentId', userId);
              if (parentStudents && parentStudents.length > 0) {
                  const classIds = Array.from(new Set(parentStudents.map(s => s.classId).filter(id => id != null))) as number[];
                  if (classIds.length > 0) {
                       const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).in('classId', classIds);
                       filterLessonIds = lessons?.map(l => l.id) || [];
                       if (filterLessonIds.length === 0) return { data: [], count: 0 };
                  } else {
                       return { data: [], count: 0 };
                  }
              } else {
                  return { data: [], count: 0 };
              }
          }
      }

      // Construir la consulta base con todas las relaciones anidadas necesarias
      let query = supabase
        .from('Assignment')
        .select(`
          id,
          title,
          startDate,
          dueDate,
          lessonId,
          lesson: Lesson (
            id, name,
            subject: Subject (id, name),
            class: Class (id, name),
            teacher: Teacher (id, name, surname)
          )
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda directa
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      // Aplicar filtro de lessonIds si se determinó alguno
      if (filterLessonIds !== null) {
        query = query.in('lessonId', filterLessonIds);
      }

      // Paginación y orden
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd).order('dueDate', { ascending: true, nullsFirst: false }); // Ordenar por fecha de entrega

      // Ejecutar la consulta
      // Definir un tipo intermedio porque Supabase devuelve fechas como string
      type RawAssignment = Omit<Assignment, 'startDate' | 'dueDate' | 'lesson'> & {
           startDate: string;
           dueDate: string;
           lesson: {
               id: number;
               name: string;
               subject: { id: number; name: string } | null;
               class: { id: number; name: string } | null;
               teacher: { id: string; name: string; surname: string } | null;
           } | null;
      };
       // Asegúrate que el tipo genérico de useSupabaseQuery coincida con lo que retorna la función
       // En este caso, la función retorna AssignmentListResult, pero el fetch devuelve RawAssignment[]
       // Se necesita mapear RawAssignment[] a Assignment[] y luego construir AssignmentListResult
      const { data, error, count } = await query.returns<RawAssignment[]>();

      if (error) {
        console.error("Error fetching assignments:", error);
        throw new Error(`Error al obtener datos de tareas: ${error.message}`);
      }

      // Mapear para convertir fechas y asegurar estructura/tipos
       const resultData: Assignment[] = data.map((assignment: RawAssignment) => ({
         ...assignment,
         startDate: new Date(assignment.startDate), // Convertir a Date
         dueDate: new Date(assignment.dueDate), // Convertir a Date
         // Asegurar que las sub-relaciones null se vuelvan undefined
         lesson: assignment.lesson ? {
             ...assignment.lesson,
             subject: assignment.lesson.subject ?? undefined,
             class: assignment.lesson.class ?? undefined,
             teacher: assignment.lesson.teacher ?? undefined
         } : undefined
      }));

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

// Tipos para mutaciones (permitir Date o string para fechas)
 type CreateAssignmentParams = {
  title: string;
  startDate?: string | Date;
  dueDate?: string | Date;
  lessonId: number;
};

type UpdateAssignmentParams = {
  id: number;
  title?: string;
  startDate?: string | Date;
  dueDate?: string | Date;
  lessonId?: number;
};

/**
 * Función para crear una nueva tarea
 */
export function useCreateAssignment() {
  return useSupabaseMutation<CreateAssignmentParams, { id: number }>(
    async (supabase, params) => {
         // Preparar datos (convertir fechas a ISO string si son Date)
         const insertData: { [key: string]: any } = { ...params };
         // Convertir Dates a ISO strings para la inserción
         if (insertData.startDate && insertData.startDate instanceof Date) {
             insertData.startDate = insertData.startDate.toISOString().slice(0, 10); // YYYY-MM-DD
         }
         if (insertData.dueDate && insertData.dueDate instanceof Date) {
             insertData.dueDate = insertData.dueDate.toISOString().slice(0, 10); // YYYY-MM-DD
         }

         const { data, error } = await supabase
            .from('Assignment')
            .insert(insertData)
            .select('id')
            .single();

         if (error) {
            console.error("Error creating assignment:", error);
            throw new Error(`Error al crear tarea: ${error.message}`);
         }

         return data as { id: number };
    },
    {
      invalidateQueries: [['assignment', 'list']],
       onError: (error) => {
         console.error("Mutation error (Create Assignment):", error);
      }
    }
  );
}

/**
 * Función para actualizar una tarea existente
 */
export function useUpdateAssignment() {
  return useSupabaseMutation<UpdateAssignmentParams, { id: number }>(
    async (supabase, params) => {
      const { id, ...rest } = params;

       // Preparar datos (convertir fechas a ISO string si son Date)
        const updateData: { [key: string]: any } = { ...rest };
         // Convertir Dates a ISO strings para la actualización
        if (updateData.startDate && updateData.startDate instanceof Date) {
            updateData.startDate = updateData.startDate.toISOString().slice(0, 10); // YYYY-MM-DD
        }
         if (updateData.dueDate && updateData.dueDate instanceof Date) {
            updateData.dueDate = updateData.dueDate.toISOString().slice(0, 10); // YYYY-MM-DD
        }

        const { data, error } = await supabase
          .from('Assignment')
          .update(updateData)
          .eq('id', id)
          .select('id')
          .single();

        if (error) {
           console.error("Error updating assignment:", error);
           throw new Error(`Error al actualizar tarea: ${error.message}`);
        }

        return data as { id: number };
    },
    {
      invalidateQueries: [['assignment', 'list']],
       onError: (error) => {
         console.error("Mutation error (Update Assignment):", error);
      }
    }
  );
}

/**
 * Función para eliminar una tarea
 */
export function useDeleteAssignment() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
        // Considerar RPC si se necesita verificar dependencias (ej: Resultados)
         /*
        CREATE OR REPLACE FUNCTION delete_assignment_if_unused(assignment_id_to_delete int)
        RETURNS void LANGUAGE plpgsql AS $$
        BEGIN
          IF EXISTS (SELECT 1 FROM public."Result" WHERE "assignmentId" = assignment_id_to_delete) THEN
             RAISE EXCEPTION 'ASSIGNMENT_HAS_RESULTS';
          END IF;
          DELETE FROM public."Assignment" WHERE id = assignment_id_to_delete;
        END;
        $$;
       */
        // const { error } = await supabase.rpc('delete_assignment_if_unused', { assignment_id_to_delete: id });

      const { error } = await supabase
        .from('Assignment')
        .delete()
        .eq('id', id);

      if (error) {
        /* if (error.message.includes('ASSIGNMENT_HAS_RESULTS')) {
             throw new Error('ASSIGNMENT_HAS_RESULTS');
        } */
        console.error("Error deleting assignment:", error);
        throw new Error(`Error al eliminar tarea: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['assignment', 'list']],
       onError: (error) => {
         console.error("Mutation error (Delete Assignment):", error);
      }
    }
  );
} 