'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Class, ClassListParams, ClassListResult, CreateClassParams, UpdateClassParams } from '@/utils/types';

/**
 * Hook para obtener la lista de clases con filtrado y paginación
 */
export function useClassList(params: ClassListParams) {
  const { page, search, gradeId } = params;
  
  return useSupabaseQuery<ClassListResult>(
    ['class', 'list', page, search, gradeId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Class')
        .select(`
          *,
          Grade(id, name)
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Filtrar por grado
      if (gradeId) {
        query = query.eq('gradeId', gradeId);
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('name');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de clases: ${error.message}`);
      }

      // Obtener conteo de estudiantes por clase
      const result: Class[] = [];
      
      for (const classItem of data as Class[]) {
        const { count: studentCount, error: countError } = await supabase
          .from('Student')
          .select('id', { count: 'exact', head: true })
          .eq('classId', classItem.id);
        
        if (countError) {
          throw new Error(`Error al contar estudiantes: ${countError.message}`);
        }
        
        result.push({
          ...classItem,
          _count: {
            students: studentCount || 0
          }
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
        throw new Error(`Error al crear clase: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['class', 'list']],
      onSuccess: () => {
        console.log('Clase creada exitosamente');
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
        throw new Error(`Error al actualizar clase: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['class', 'list']],
      onSuccess: () => {
        console.log('Clase actualizada exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar una clase
 */
export function useDeleteClass() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      // Verificar si hay estudiantes asignados
      const { count, error: countError } = await supabase
        .from('Student')
        .select('id', { count: 'exact', head: true })
        .eq('classId', id);
      
      if (countError) {
        throw new Error(`Error al verificar estudiantes: ${countError.message}`);
      }
      
      if (count && count > 0) {
        throw new Error(`No se puede eliminar la clase porque tiene ${count} estudiantes asignados`);
      }
      
      const { error } = await supabase
        .from('Class')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar clase: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['class', 'list']],
      onSuccess: () => {
        console.log('Clase eliminada exitosamente');
      }
    }
  );
}