'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Class, ClassListParams, ClassListResult, CreateClassParams, UpdateClassParams } from '@/utils/types/class';

/**
 * Hook para obtener la lista de clases con filtrado y paginación optimizado
 */
export function useClassList(params: ClassListParams & { userRole?: string; userId?: string }) {
  const { page, search, gradeId, userRole, userId } = params;

  return useSupabaseQuery<ClassListResult>(
    ['class', 'list', page, search, gradeId, userRole, userId],
    async (supabase) => {

      // **Manejo de filtros dependientes del rol (antes de construir la query principal)**
      // Esto es necesario porque los filtros para student/parent dependen de datos externos
      let specificClassIds: number[] | null = null;

      if (userRole && userRole !== 'admin' && userId) {
        if (userRole === 'student') {
          const { data: studentData } = await supabase
            .from('Student')
            .select('classId')
            .eq('id', userId)
            .single();
          if (studentData?.classId) {
            specificClassIds = [studentData.classId];
          } else {
            return { data: [], count: 0 }; // Estudiante sin clase asignada
          }
        } else if (userRole === 'parent') {
          const { data: parentStudents } = await supabase
            .from('Student')
            .select('classId')
            .eq('parentId', userId);
          if (parentStudents && parentStudents.length > 0) {
            // Filtrar nulls/undefined y obtener únicos
            specificClassIds = Array.from(new Set(parentStudents.map(s => s.classId).filter(id => id != null))) as number[];
            if (specificClassIds.length === 0) {
              return { data: [], count: 0 }; // Hijos sin clase asignada
            }
          } else {
            return { data: [], count: 0 }; // Padre sin hijos
          }
        }
      }

      // Construir la consulta base incluyendo datos relacionados
      let query = supabase
        .from('Class')
        .select(`
          id,
          name,
          capacity,
          gradeId,
          supervisorId,
          Grade:gradeId (id, level),
          Supervisor:supervisorId (id, name, surname),
          Student(count) 
        `, { count: 'exact' }); // Contar estudiantes usando relación

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Filtrar por grado
      if (gradeId) {
        query = query.eq('gradeId', gradeId);
      }

      // Aplicar filtro por rol de profesor supervisor
      if (userRole === 'teacher' && userId) {
        query = query.eq('supervisorId', userId);
      }

      // Aplicar filtro por IDs específicos (para student/parent)
      if (specificClassIds !== null) {
        query = query.in('id', specificClassIds);
      }

      // Paginación y orden
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd).order('name');

      // Ejecutar la consulta única
      // Usamos un tipo intermedio porque Supabase anida el count de Student
      type ClassWithNestedCount = Omit<Class, '_count'> & {
        Grade?: { id: number; level: number } | null;
        Supervisor?: { id: string; name: string; surname: string } | null;
        Student: { count: number }[]; // Supabase devuelve un array con un objeto count
      };
      const { data, error, count } = await query.returns<ClassWithNestedCount[]>();

      if (error) {
        console.error("Error fetching classes:", error);
        throw new Error(`Error al obtener datos de clases: ${error.message}`);
      }

      // Mapear los resultados al tipo esperado (Class[])
      const result: Class[] = data.map(classItem => ({
        id: classItem.id,
        name: classItem.name,
        capacity: classItem.capacity,
        gradeId: classItem.gradeId,
        supervisorId: classItem.supervisorId,
        Grade: classItem.Grade ?? undefined,
        Supervisor: classItem.Supervisor ?? undefined,
        _count: {
          // Extraer el count del array anidado
          students: classItem.Student[0]?.count ?? 0
        }
      }));

      return {
        data: result,
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
 * Función para crear una nueva clase
 */
export function useCreateClass() {
  return useSupabaseMutation<CreateClassParams, { id: number }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Class')
        .insert(params)
        .select('id')
        .single();

      if (error) {
        console.error("Error creating class:", error);
        throw new Error(`Error al crear clase: ${error.message}`);
      }

      return data as { id: number };
    },
    {
      invalidateQueries: [['class', 'list']],
      onError: (error) => {
        console.error("Mutation error (Create Class):", error);
      }
    }
  );
}

/**
 * Función para actualizar una clase existente
 */
export function useUpdateClass() {
  return useSupabaseMutation<UpdateClassParams, { id: number }>(
    async (supabase, params) => {
      const { id, ...rest } = params;

      const { data, error } = await supabase
        .from('Class')
        .update(rest)
        .eq('id', id)
        .select('id')
        .single();

      if (error) {
        console.error("Error updating class:", error);
        throw new Error(`Error al actualizar clase: ${error.message}`);
      }

      return data as { id: number };
    },
    {
      invalidateQueries: [['class', 'list']],
      onError: (error) => {
        console.error("Mutation error (Update Class):", error);
      }
    }
  );
}

/**
 * Función para eliminar una clase (optimizada)
 */
export function useDeleteClass() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      // **Optimización: Usar RPC para verificar y eliminar en una sola transacción**
      // Esto evita la condición de carrera donde un estudiante podría ser añadido
      // entre la verificación y la eliminación.
      // Requiere una función SQL en Supabase como:
      /*
      CREATE OR REPLACE FUNCTION delete_class_if_empty(class_id_to_delete int)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER -- Importante para permisos
      AS $$
      BEGIN
        IF EXISTS (SELECT 1 FROM public."Student" WHERE "classId" = class_id_to_delete) THEN
          RAISE EXCEPTION 'Cannot delete class with ID % because it has students assigned.', class_id_to_delete;
        ELSE
          DELETE FROM public."Class" WHERE id = class_id_to_delete;
        END IF;
      END;
      $$;
      */

      // const { error } = await supabase.rpc('delete_class_if_empty', { class_id_to_delete: id });

      // Manejo de error original (si no se usa RPC)


      const { count, error: countError } = await supabase
        .from('Student')
        .select('id', { count: 'exact', head: true })
        .eq('classId', id);

      if (countError) {
        console.error("Error checking students before delete:", countError);
        throw new Error(`Error al verificar estudiantes: ${countError.message}`);
      }

      // Si hay estudiantes, no permitir eliminar la clase
      if (count && count > 0) {
        // Lanzar error específico para que el frontend pueda mostrar mensaje útil
        throw new Error(`CLASS_HAS_STUDENTS:${count}`); // Usar un código/mensaje específico
      }

      // Si no hay estudiantes, proceder con la eliminación
      const { error } = await supabase
        .from('Class')
        .delete()
        .eq('id', id);

      if (error) {
        // Intentar parsear el mensaje de error si viene de la función RPC
        if (error.message.includes('Cannot delete class')) {
          throw new Error('CLASS_HAS_STUDENTS'); // Lanzar error específico
        }
        console.error("Error deleting class:", error);
        throw new Error(`Error al eliminar clase: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['class', 'list']],
      onError: (error) => {
        console.error("Mutation error (Delete Class):", error);
        // No relanzar aquí, el error ya se lanzó desde la función de mutación
      }
    }
  );
}