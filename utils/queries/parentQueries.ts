'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Parent, ParentListParams, ParentListResult, CreateParentParams, UpdateParentParams } from '@/utils/types';

/**
 * Hook para obtener la lista de padres con filtrado y paginación
 */
export function useParentList(params: ParentListParams) {
  const { page, search, studentId, classId } = params;
  
  return useSupabaseQuery<ParentListResult>(
    ['parent', 'list', page, search, studentId, classId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Parent')
        .select('*', { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      // Filtrar por estudiante
      if (studentId) {
        const { data: student, error: studentError } = await supabase
          .from('Student')
          .select('parentId')
          .eq('id', studentId)
          .single();
          
        if (studentError) {
          throw new Error(`Error al obtener datos del estudiante: ${studentError.message}`);
        }
        
        if (student && student.parentId) {
          query = query.eq('id', student.parentId);
        } else {
          return { data: [], count: 0 };
        }
      }

      // Filtrar por clase
      if (classId) {
        const { data: classStudents, error: classError } = await supabase
          .from('Student')
          .select('parentId')
          .eq('classId', classId)
          .not('parentId', 'is', null);
          
        if (classError) {
          throw new Error(`Error al obtener estudiantes de la clase: ${classError.message}`);
        }
        
        if (classStudents && classStudents.length > 0) {
          const parentIds = Array.from(new Set(classStudents.map(student => student.parentId)));
          query = query.in('id', parentIds);
        } else {
          return { data: [], count: 0 };
        }
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('surname');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de padres: ${error.message}`);
      }

      // Obtener estudiantes relacionados
      const result: Parent[] = [];
      
      for (const parent of data as Parent[]) {
        const { data: students, error: studentsError } = await supabase
          .from('Student')
          .select(`
            id, 
            name, 
            surname,
            Class(id, name)
          `)
          .eq('parentId', parent.id);
        
        if (studentsError) {
          throw new Error(`Error al obtener estudiantes: ${studentsError.message}`);
        }
        
        result.push({
          ...parent,
          students: students || []
        });
      }

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
        email: params.email || `${params.username}@example.com`,
        password: params.password || "",
        options: {
          data: {
            role: "parent",
            name: params.name,
            surname: params.surname
          }
        }
      });
      
      if (authError) {
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
        throw new Error(`Error al crear padre: ${parentError.message}`);
      }
      
      return { id: authData.user.id };
    },
    {
      invalidateQueries: [['parent', 'list']],
      onSuccess: () => {
        console.log('Padre creado exitosamente');
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
        const { error: authError } = await supabase.auth.updateUser({
          password
        });
        
        if (authError) {
          throw new Error(`Error al actualizar contraseña: ${authError.message}`);
        }
      }
      
      // Actualizar registro en la tabla de parents
      const { error: parentError } = await supabase
        .from('Parent')
        .update(parentData)
        .eq('id', id);
      
      if (parentError) {
        throw new Error(`Error al actualizar padre: ${parentError.message}`);
      }
      
      return { id };
    },
    {
      invalidateQueries: [['parent', 'list']],
      onSuccess: () => {
        console.log('Padre actualizado exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar un padre
 */
export function useDeleteParent() {
  return useSupabaseMutation<{ id: string }, void>(
    async (supabase, { id }) => {
      // Verificar si hay estudiantes relacionados
      const { count, error: countError } = await supabase
        .from('Student')
        .select('id', { count: 'exact', head: true })
        .eq('parentId', id);
        
      if (countError) {
        throw new Error(`Error al verificar estudiantes: ${countError.message}`);
      }
      
      if (count && count > 0) {
        throw new Error(`No se puede eliminar este padre porque tiene ${count} estudiantes asociados`);
      }
      
      // Eliminar el registro de parent
      const { error: parentError } = await supabase
        .from('Parent')
        .delete()
        .eq('id', id);
      
      if (parentError) {
        throw new Error(`Error al eliminar padre: ${parentError.message}`);
      }
      
      // Eliminar el usuario de Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        throw new Error(`Error al eliminar usuario: ${authError.message}`);
      }
    },
    {
      invalidateQueries: [['parent', 'list']],
      onSuccess: () => {
        console.log('Padre eliminado exitosamente');
      }
    }
  );
}

/**
 * Hook para obtener información específica de un padre, incluyendo todos sus estudiantes
 */
export function useParentDetails(parentId: string) {
  return useSupabaseQuery<Parent>(
    ['parent', 'details', parentId],
    async (supabase) => {
      if (!parentId) {
        throw new Error('Se requiere el ID del padre');
      }
      
      // Obtener información del padre
      const { data: parent, error: parentError } = await supabase
        .from('Parent')
        .select('*')
        .eq('id', parentId)
        .single();
      
      if (parentError) {
        throw new Error(`Error al obtener datos del padre: ${parentError.message}`);
      }
      
      // Obtener todos los estudiantes asociados con información detallada
      const { data: students, error: studentsError } = await supabase
        .from('Student')
        .select(`
          id, 
          name, 
          surname,
          email,
          phone,
          Class(id, name, Grade(id, name)),
          gradeId,
          classId
        `)
        .eq('parentId', parentId);
      
      if (studentsError) {
        throw new Error(`Error al obtener estudiantes: ${studentsError.message}`);
      }
      
      return {
        ...parent,
        students: students || []
      } as Parent;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
      enabled: !!parentId // Solo ejecutar si hay un ID de padre
    }
  );
}