'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Parent, ParentListParams, ParentListResult, CreateParentParams, UpdateParentParams } from '@/utils/types/parent';
import { createClient } from '@/utils/supabase/client'; // Importar para filtros

/**
 * Hook para obtener la lista de padres con filtrado y paginación optimizado
 */
export function useParentList(params: ParentListParams) {
  const { page, search, studentId, classId } = params;

  return useSupabaseQuery<ParentListResult>(
    ['parent', 'list', page, search, studentId, classId],
    async (supabase) => {

      let parentIdFromStudent: string | null = null;
      let parentIdsFromClass: string[] | null = null;

      // **Manejo de filtros dependientes (antes de construir la query principal)**
      if (studentId) {
        const { data: student, error: studentError } = await supabase
          .from('Student')
          .select('parentId')
          .eq('id', studentId)
          .maybeSingle(); // Usar maybeSingle para manejar caso de estudiante no encontrado

        if (studentError) {
          console.error("Error fetching student for parent filter:", studentError);
          throw new Error(`Error al obtener datos del estudiante: ${studentError.message}`);
        }
        if (student?.parentId) {
          parentIdFromStudent = student.parentId;
        } else {
          return { data: [], count: 0 }; // Estudiante no encontrado o sin padre
        }
      }

      if (classId) {
        const { data: classStudents, error: classError } = await supabase
          .from('Student')
          .select('parentId')
          .eq('classId', classId)
          .not('parentId', 'is', null);

        if (classError) {
           console.error("Error fetching students for class filter:", classError);
           throw new Error(`Error al obtener estudiantes de la clase: ${classError.message}`);
        }
        if (classStudents && classStudents.length > 0) {
           parentIdsFromClass = Array.from(new Set(classStudents.map(student => student.parentId as string)));
           if (parentIdsFromClass.length === 0) {
             return { data: [], count: 0 }; // No hay padres en esa clase
           }
        } else {
          return { data: [], count: 0 }; // No hay estudiantes con padre en esa clase
        }
      }

      // Construir la consulta base con estudiantes relacionados
      let query = supabase
        .from('Parent')
        .select(`
          id,
          username,
          name,
          surname,
          email,
          phone,
          address,
          students:Student (
            id, name, surname,
            Class (id, name)
          )
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      // Aplicar filtros dependientes
      if (parentIdFromStudent) {
        query = query.eq('id', parentIdFromStudent);
      }
      if (parentIdsFromClass) {
         // Si ambos filtros están presentes, necesitamos los padres que están en AMBAS listas
         // Esto es más fácil filtrando después o usando RPC. Por ahora, aplicamos el más restrictivo si ambos existen.
         if (parentIdFromStudent && !parentIdsFromClass.includes(parentIdFromStudent)) {
              return { data: [], count: 0 }; // El padre del estudiante no está en la clase
         } else if (parentIdFromStudent) {
            // parentIdFromStudent ya está aplicado
         } else {
            query = query.in('id', parentIdsFromClass);
         }
      }

      // Paginación y orden
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd).order('surname');

      // Ejecutar la consulta única
      type ParentWithStudents = Omit<Parent, 'students'> & {
        students: {
            id: string;
            name: string;
            surname: string;
            Class: { id: number; name: string } | null;
        }[]
      }
      const { data, error, count } = await query.returns<ParentWithStudents[]>();

      if (error) {
        console.error("Error fetching parents:", error);
        throw new Error(`Error al obtener datos de padres: ${error.message}`);
      }

      // Mapear para asegurar la estructura correcta si es necesario (en este caso, el select ya la da)
      const result: Parent[] = data.map(p => ({
        ...p,
        students: p.students.map(s => ({...s, Class: s.Class ?? undefined}))
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
 * Función para crear un nuevo padre
 */
export function useCreateParent() {
  return useSupabaseMutation<CreateParentParams, { id: string }>(
    async (supabase, params) => {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email || `${params.username}@example.com`, // Usar email real o placeholder
        password: params.password || "", // Asegurarse que la contraseña no esté vacía
        options: {
          data: {
            role: "parent",
            name: params.name,
            surname: params.surname
          }
        }
      });

      if (authError) {
        console.error("Error signing up parent:", authError);
        throw new Error(`Error al crear usuario: ${authError.message}`);
      }

      if (!authData.user?.id) {
        throw new Error('No se pudo obtener el ID del usuario creado');
      }

      // Crear registro en la tabla de parents
      const { error: parentError } = await supabase
        .from('Parent')
        .insert({
          id: authData.user.id,
          username: params.username,
          name: params.name,
          surname: params.surname,
          email: params.email || null,
          phone: params.phone,
          address: params.address
        });

      if (parentError) {
        // Intentar eliminar el usuario de Auth si la inserción en Parent falla
        try {
             await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
             console.error("Failed to delete Auth user after Parent insert failed:", deleteError);
        }
        console.error("Error inserting parent record:", parentError);
        throw new Error(`Error al crear padre: ${parentError.message}`);
      }

      return { id: authData.user.id };
    },
    {
      invalidateQueries: [['parent', 'list']],
      onError: (error) => {
         console.error("Mutation error (Create Parent):", error);
      }
    }
  );
}

/**
 * Función para actualizar un padre existente
 */
export function useUpdateParent() {
  return useSupabaseMutation<UpdateParentParams, { id: string }>(
    async (supabase, params) => {
      const { id, password, ...parentData } = params;

      // Actualizar usuario en Auth si hay nueva contraseña
      if (password) {
        // **Importante:** Actualizar la contraseña requiere que el usuario esté logueado.
        // Si esta mutación la ejecuta un admin, necesitaría usar supabase.auth.admin.updateUserById()
        const { error: authError } = await supabase.auth.updateUser({ password });

        if (authError) {
          console.error("Error updating parent password:", authError);
          throw new Error(`Error al actualizar contraseña: ${authError.message}`);
        }
      }

      // Actualizar registro en la tabla de parents
      const { error: parentError } = await supabase
        .from('Parent')
        .update(parentData)
        .eq('id', id)
        .select('id') // Solo necesitamos saber si tuvo éxito
        .single();

      if (parentError) {
        console.error("Error updating parent record:", parentError);
        throw new Error(`Error al actualizar padre: ${parentError.message}`);
      }

      return { id };
    },
    {
      invalidateQueries: [['parent', 'list'], ['parent', 'details', (params: UpdateParentParams | undefined) => params?.id]], // Invalidar detalles también
       onError: (error) => {
         console.error("Mutation error (Update Parent):", error);
      }
    }
  );
}

/**
 * Función para eliminar un padre (optimizada con RPC)
 */
export function useDeleteParent() {
  return useSupabaseMutation<{ id: string }, void>(
    async (supabase, { id }) => {
        // **Optimización: Usar RPC para verificar estudiantes y eliminar Parent + Auth User**
        // Requiere una función SQL en Supabase como:
        /*
        CREATE OR REPLACE FUNCTION delete_parent_and_auth_user(parent_id_to_delete uuid)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Verificar si hay estudiantes asociados
          IF EXISTS (SELECT 1 FROM public."Student" WHERE "parentId" = parent_id_to_delete) THEN
            RAISE EXCEPTION 'Cannot delete parent with ID % because they have students assigned.', parent_id_to_delete;
          END IF;

          -- Eliminar de la tabla Parent
          DELETE FROM public."Parent" WHERE id = parent_id_to_delete;

          -- Eliminar de auth.users (ignorar si no existe por alguna razón)
          BEGIN
            PERFORM auth.admin_delete_user(parent_id_to_delete);
          EXCEPTION
            WHEN others THEN -- Capturar cualquier error (ej. usuario no encontrado)
              RAISE NOTICE 'Could not delete auth user %: %', parent_id_to_delete, SQLERRM;
          END;

        END;
        $$;
        */

        const { error } = await supabase.rpc('delete_parent_and_auth_user', { parent_id_to_delete: id });

        if (error) {
            if (error.message.includes('Cannot delete parent')) {
               throw new Error('PARENT_HAS_STUDENTS'); // Error específico
            }
            console.error("Error deleting parent via RPC:", error);
            throw new Error(`Error al eliminar padre: ${error.message}`);
        }

        // Código original (menos seguro por condiciones de carrera y múltiples llamadas)
        /*
        // 1. Verificar si hay estudiantes relacionados
        const { count, error: countError } = await supabase
          .from('Student')
          .select('id', { count: 'exact', head: true })
          .eq('parentId', id);

        if (countError) {
           console.error("Error checking students before parent delete:", countError);
           throw new Error(`Error al verificar estudiantes: ${countError.message}`);
        }

        if (count && count > 0) {
           throw new Error(`PARENT_HAS_STUDENTS:${count}`);
        }

        // 2. Eliminar el registro de parent
        const { error: parentError } = await supabase
          .from('Parent')
          .delete()
          .eq('id', id);

        if (parentError) {
           console.error("Error deleting parent record:", parentError);
           throw new Error(`Error al eliminar padre: ${parentError.message}`);
        }

        // 3. Eliminar el usuario de Auth (requiere rol de servicio o permisos admin)
        const { error: authError } = await supabase.auth.admin.deleteUser(id);

        if (authError) {
           // Podría fallar si el usuario ya fue eliminado o hubo un problema
           // Considerar si esto debe ser un error fatal o solo un warning
           console.error("Error deleting parent Auth user:", authError);
           // No relanzar el error necesariamente, el registro Parent ya fue eliminado
           // throw new Error(`Error al eliminar usuario: ${authError.message}`);
        }
        */
    },
    {
      invalidateQueries: [['parent', 'list']],
      onError: (error) => {
         console.error("Mutation error (Delete Parent):", error);
      }
    }
  );
}

/**
 * Hook para obtener información específica de un padre, incluyendo todos sus estudiantes (optimizado)
 */
export function useParentDetails(parentId: string) {
  return useSupabaseQuery<Parent | null>(
    ['parent', 'details', parentId],
    async (supabase) => {
      if (!parentId) {
        // Devolver null en lugar de lanzar error si no hay ID, 
        // así el componente puede manejarlo
        return null;
      }

      // Obtener padre y estudiantes en una sola consulta
      const { data, error } = await supabase
        .from('Parent')
        .select(`
          *,
          students:Student (
            id, name, surname, email, phone, gradeId, classId,
            Class (id, name, Grade(id, level))
          )
        `)
        .eq('id', parentId)
        .maybeSingle(); // Usar maybeSingle por si el ID no existe

      if (error) {
        console.error("Error fetching parent details:", error);
        throw new Error(`Error al obtener datos del padre: ${error.message}`);
      }
      
      // Supabase devuelve null si no se encuentra con maybeSingle
      if (!data) {
        return null;
      }

      // Mapear para asegurar estructura y tipos (ej. convertir Class/Grade anidados)
      const parentDetails: Parent = {
          ...data,
          students: data.students?.map((s: any) => ({
              ...s,
              Class: s.Class ? {
                  ...s.Class,
                  Grade: s.Class.Grade ?? undefined
              } : undefined
          })) || []
      };

      return parentDetails;
    },
    {
      staleTime: 1000 * 60 * 15, // Podría tener un staleTime más largo si los detalles no cambian mucho
      refetchOnWindowFocus: false,
      enabled: !!parentId // Solo ejecutar si hay un ID de padre
    }
  );
}