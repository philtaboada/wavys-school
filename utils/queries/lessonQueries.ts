'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Lesson } from '@/utils/types/lesson';
import { createClient } from '@/utils/supabase/client'; // Importar para filtros

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

/**
 * Hook para obtener la lista de lecciones con filtrado y paginación optimizado
 */
export function useLessonList(params: LessonListParams & { userRole?: string; userId?: string }) {
  const { page, search, classId, teacherId, subjectId, userRole, userId } = params;

  return useSupabaseQuery<LessonListResult>(
    ['lesson', 'list', page, search, classId, teacherId, subjectId, userRole, userId],
    async (supabase) => {

      let filterClassIds: number[] | null = null;

       // **Manejo de filtros dependientes del rol (antes de construir la query principal)**
       if (userRole && userRole !== 'admin' && userRole !== 'teacher' && userId) {
           if (userRole === 'student') {
              const { data: studentData } = await supabase
                .from('Student')
                .select('classId')
                .eq('id', userId)
                .maybeSingle();
              if (studentData?.classId) {
                 filterClassIds = [studentData.classId];
              } else {
                 return { data: [], count: 0 }; // Estudiante sin clase
              }
           } else if (userRole === 'parent') {
              const { data: parentStudents } = await supabase
                 .from('Student')
                 .select('classId')
                 .eq('parentId', userId);
              if (parentStudents && parentStudents.length > 0) {
                 // Usar Set para obtener IDs únicos y filtrar nulls
                 const uniqueClassIds = Array.from(new Set(parentStudents.map(s => s.classId).filter(id => id != null))) as number[];
                  if (uniqueClassIds.length > 0) {
                      filterClassIds = uniqueClassIds;
                  } else {
                     return { data: [], count: 0 }; // Hijos sin clase
                  }
              } else {
                 return { data: [], count: 0 }; // Padre sin hijos
              }
           }
       }

      // Construir la consulta base con relaciones
      let query = supabase
        .from('Lesson')
        .select(`
          id,
          name,
          classId,
          teacherId,
          subjectId,
          Class (id, name),
          Teacher (id, name, surname),
          Subject (id, name)
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda sobre relaciones
      if (search) {
        // Buscar por nombre de asignatura, profesor o nombre de lección
        query = query.or(`Subject.name.ilike.%${search}%,Teacher.name.ilike.%${search}%,Teacher.surname.ilike.%${search}%,name.ilike.%${search}%`);
      }

      // Filtros explícitos (tienen prioridad si se proporcionan)
      if (classId) {
        query = query.eq('classId', classId);
      }
      if (teacherId) {
        query = query.eq('teacherId', teacherId);
      }
      if (subjectId) {
        query = query.eq('subjectId', subjectId);
      }

      // Filtros implícitos por rol (aplicar si no hay filtro explícito)
      if (userRole === 'teacher' && userId && !teacherId) {
        query = query.eq('teacherId', userId);
      }
      // Aplicar filtro de classIds para student/parent si no se filtró por classId explícito
      if (filterClassIds !== null && !classId) {
          query = query.in('classId', filterClassIds);
      }

      // Paginación y orden
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd).order('id', { ascending: false });

      // Ejecutar consulta
      const { data, error, count } = await query.returns<Lesson[]>(); // Especificar tipo de retorno

      if (error) {
        console.error("Error fetching lessons:", error);
        throw new Error(`Error al obtener datos de lecciones: ${error.message}`);
      }

      // Mapear resultados para asegurar tipos (convertir relaciones null a undefined)
      const resultData = data.map(lesson => ({
         ...lesson,
         Class: lesson.Class ?? undefined,
         Teacher: lesson.Teacher ?? undefined,
         Subject: lesson.Subject ?? undefined,
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

/**
 * Función para crear una nueva lección
 */
export function useCreateLesson() {
  return useSupabaseMutation<Lesson, { id: number }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Lesson')
        .insert({
          name: params.name || `${params.subjectId}-${params.classId}-${params.teacherId}`, // Generar nombre si no se provee
          classId: params.classId,
          teacherId: params.teacherId,
          subjectId: params.subjectId
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error creating lesson:", error);
        throw new Error(`Error al crear lección: ${error.message}`);
      }

      return data as { id: number };
    },
    {
      invalidateQueries: [['lesson', 'list']],
      onError: (error) => {
        console.error("Mutation error (Create Lesson):", error);
      }
    }
  );
}

/**
 * Función para actualizar una lección existente
 */
export function useUpdateLesson() {
  return useSupabaseMutation<Lesson, { id: number }>(
    async (supabase, params) => {
      const { id, ...lessonData } = params;

      const { data, error } = await supabase
        .from('Lesson')
        .update(lessonData)
        .eq('id', id)
        .select('id') // Solo necesitamos confirmar que funcionó
        .single();

      if (error) {
        console.error("Error updating lesson:", error);
        throw new Error(`Error al actualizar lección: ${error.message}`);
      }

      return data as { id: number };
    },
    {
      invalidateQueries: [['lesson', 'list']],
      onError: (error) => {
         console.error("Mutation error (Update Lesson):", error);
      }
    }
  );
}

/**
 * Función para eliminar una lección (optimizada con RPC)
 */
export function useDeleteLesson() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {

        // **Optimización: Usar RPC para verificar dependencias y eliminar**
        /*
        CREATE OR REPLACE FUNCTION delete_lesson_if_unused(lesson_id_to_delete int)
        RETURNS void
        LANGUAGE plpgsql
        AS $$
        BEGIN
          -- Verificar exámenes asociados
          IF EXISTS (SELECT 1 FROM public."Exam" WHERE "lessonId" = lesson_id_to_delete) THEN
            RAISE EXCEPTION 'LESSON_HAS_EXAMS';
          END IF;
          -- Verificar tareas asociadas
           IF EXISTS (SELECT 1 FROM public."Assignment" WHERE "lessonId" = lesson_id_to_delete) THEN
            RAISE EXCEPTION 'LESSON_HAS_ASSIGNMENTS';
          END IF;
           -- Verificar asistencias asociadas
          IF EXISTS (SELECT 1 FROM public."Attendance" WHERE "lessonId" = lesson_id_to_delete) THEN
            RAISE EXCEPTION 'LESSON_HAS_ATTENDANCE';
          END IF;

          -- Eliminar la lección si no hay dependencias
          DELETE FROM public."Lesson" WHERE id = lesson_id_to_delete;
        END;
        $$;
        */
        const { error } = await supabase.rpc('delete_lesson_if_unused', { lesson_id_to_delete: id });

        if (error) {
            if (error.message.includes('LESSON_HAS_EXAMS')) {
                throw new Error('LESSON_HAS_EXAMS');
            } else if (error.message.includes('LESSON_HAS_ASSIGNMENTS')) {
                 throw new Error('LESSON_HAS_ASSIGNMENTS');
            } else if (error.message.includes('LESSON_HAS_ATTENDANCE')) {
                 throw new Error('LESSON_HAS_ATTENDANCE');
            }
            console.error("Error deleting lesson via RPC:", error);
            throw new Error(`Error al eliminar lección: ${error.message}`);
        }

        // Código Original (menos seguro)
        /*
        const { count: examCount, error: examError } = await supabase
          .from('Exam').select('id', { count: 'exact', head: true }).eq('lessonId', id);
        if (examError) {
            console.error("Error checking exams before lesson delete:", examError);
            throw new Error(`Error al verificar exámenes: ${examError.message}`);
        }
        if (examCount && examCount > 0) throw new Error(`LESSON_HAS_EXAMS:${examCount}`);

         const { count: assignmentCount, error: assignmentError } = await supabase
          .from('Assignment').select('id', { count: 'exact', head: true }).eq('lessonId', id);
         if (assignmentError) {
             console.error("Error checking assignments before lesson delete:", assignmentError);
             throw new Error(`Error al verificar tareas: ${assignmentError.message}`);
         }
         if (assignmentCount && assignmentCount > 0) throw new Error(`LESSON_HAS_ASSIGNMENTS:${assignmentCount}`);

        const { count: attendanceCount, error: attendanceError } = await supabase
          .from('Attendance').select('id', { count: 'exact', head: true }).eq('lessonId', id);
        if (attendanceError) {
            console.error("Error checking attendance before lesson delete:", attendanceError);
            throw new Error(`Error al verificar asistencias: ${attendanceError.message}`);
        }
        if (attendanceCount && attendanceCount > 0) throw new Error(`LESSON_HAS_ATTENDANCE:${attendanceCount}`);

        const { error } = await supabase.from('Lesson').delete().eq('id', id);
        if (error) {
            console.error("Error deleting lesson record:", error);
            throw new Error(`Error al eliminar lección: ${error.message}`);
        }
        */
    },
    {
      invalidateQueries: [['lesson', 'list']],
       onError: (error) => {
         console.error("Mutation error (Delete Lesson):", error);
      }
    }
  );
} 