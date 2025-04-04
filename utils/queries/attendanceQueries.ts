'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Attendance, AttendanceListParams, AttendanceListResult } from '@/utils/types/attendance';
import { createClient } from '@/utils/supabase/client'; // Importar para filtros

/**
 * Hook para obtener la lista de asistencias con filtrado y paginación optimizado
 */
export function useAttendanceList(params: AttendanceListParams) {
  const { page, search, userId, role } = params;

  return useSupabaseQuery<AttendanceListResult>(
    ['attendance', 'list', page, search, role, userId],
    async (supabase) => {

      let filterLessonIds: number[] | null = null;
      let filterStudentIds: string[] | null = null;

      // **Manejo de filtros dependientes (antes de construir la query principal)**
      if (role === "teacher" && userId) {
        const { data: teacherLessons } = await supabase
          .from('Lesson')
          .select('id')
          .eq('teacherId', userId);
        if (teacherLessons && teacherLessons.length > 0) {
          filterLessonIds = teacherLessons.map(lesson => lesson.id);
        } else {
          return { data: [], count: 0 }; // Profesor sin lecciones
        }
      } else if (role === "parent" && userId) {
        const { data: parentStudents } = await supabase
          .from('Student')
          .select('id')
          .eq('parentId', userId);
        if (parentStudents && parentStudents.length > 0) {
          filterStudentIds = parentStudents.map(student => student.id);
        } else {
          return { data: [], count: 0 }; // Padre sin hijos
        }
      }

      // Obtener IDs de estudiantes por búsqueda si es necesario
      let searchStudentIds: string[] | null = null;
      if (search) {
          const searchLower = search.toLowerCase();
          const { data: studentsByName } = await supabase
             .from('Student')
             .select('id')
             .or(`name.ilike.%${searchLower}%,surname.ilike.%${searchLower}%`);
          if (studentsByName && studentsByName.length > 0) {
              searchStudentIds = studentsByName.map(s => s.id);
              // Si la búsqueda no encuentra estudiantes, no habrá resultados
              if (searchStudentIds.length === 0) {
                  return { data: [], count: 0 };
              }
          } else {
               return { data: [], count: 0 };
          }
      }

      // Construir la consulta base con relaciones
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
      if (filterLessonIds) {
        query = query.in('lessonId', filterLessonIds);
      }
      // El filtro por rol 'student' es directo
      if (role === "student" && userId) {
        query = query.eq('studentId', userId);
      }
      // Aplicar filtro por studentIds de padre
      if (filterStudentIds) {
         // Si también hay filtro por búsqueda, interseccionar los IDs
         if (searchStudentIds) {
            const intersection = filterStudentIds.filter(id => searchStudentIds!.includes(id));
            if (intersection.length === 0) return { data: [], count: 0 };
            query = query.in('studentId', intersection);
         } else {
            query = query.in('studentId', filterStudentIds);
         }
      } else if (searchStudentIds) {
         // Aplicar solo filtro por búsqueda si no hay filtro de padre
         query = query.in('studentId', searchStudentIds);
      }

      // Paginación y orden
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd).order('date', { ascending: false }); // Ordenar por fecha descendente

      // Ejecutar consulta
      const { data, error, count } = await query.returns<Attendance[]>();

      if (error) {
        console.error("Error fetching attendance:", error);
        throw new Error(`Error al obtener datos de asistencia: ${error.message}`);
      }

       // Mapear resultados para asegurar tipos (convertir relaciones null a undefined)
       const resultData = data.map(att => ({
          ...att,
          Student: att.Student ?? undefined,
          Lesson: att.Lesson ? {
             ...att.Lesson,
             Subject: att.Lesson.Subject ?? undefined
          } : undefined
       }));

      return {
        data: resultData,
        count: count || 0
      };
    },
    {
      staleTime: 1000 * 60 * 2, // StaleTime más corto para asistencia? O mantener 5 min?
      refetchOnWindowFocus: true // Podría ser útil para asistencia
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
        console.error("Error creating attendance:", error);
        throw new Error(`Error al crear asistencia: ${error.message}`);
      }

      return data as { id: number };
    },
    {
      invalidateQueries: [['attendance', 'list'], ['attendance', 'weekly']], // Invalidar lista y vista semanal (si existe)
       onError: (error) => {
         console.error("Mutation error (Create Attendance):", error);
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
        console.error("Error updating attendance:", error);
        throw new Error(`Error al actualizar asistencia: ${error.message}`);
      }

      return data as { id: number };
    },
    {
      invalidateQueries: [['attendance', 'list'], ['attendance', 'weekly']],
       onError: (error) => {
         console.error("Mutation error (Update Attendance):", error);
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
        console.error("Error deleting attendance:", error);
        throw new Error(`Error al eliminar asistencia: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['attendance', 'list'], ['attendance', 'weekly']],
       onError: (error) => {
         console.error("Mutation error (Delete Attendance):", error);
      }
    }
  );
} 