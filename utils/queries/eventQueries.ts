'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Event } from '@/utils/types/event';

// Tipos para los parámetros y resultados
export type EventListParams = {
  page: number;
  search?: string;
  classId?: string;
};

export type EventListResult = {
  data: Event[];
  count: number;
};

export type CreateEventParams = {
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  classId?: string;
};

export type UpdateEventParams = {
  id: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  classId?: string;
};

/**
 * Hook para obtener la lista de eventos con filtrado y paginación
 */
export function useEventList(params: EventListParams & { userRole?: string; userId?: string }) {
  const { page, search, classId, userRole, userId } = params;
  
  return useSupabaseQuery<EventListResult>(
    ['event', 'list', page, search, classId, userRole, userId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Event')
        .select('*, class:classId(id, name)', { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      // Filtrar por clase
      if (classId) {
        query = query.eq('classId', classId);
      }

      // Filtros específicos según el rol del usuario
      if (userRole && userRole !== 'admin' && userId) {
        let userClassIds: string[] = [];

        // Obtener las clases asociadas según el rol del usuario
        if (userRole === 'teacher') {
          const { data: classes } = await supabase
            .from('Lesson')
            .select('classId')
            .eq('teacherId', userId);

          userClassIds = classes?.map(c => c.classId) || [];
        } 
        else if (userRole === 'student') {
          const { data: classes } = await supabase
            .from('Student')
            .select('classId')
            .eq('id', userId);

          userClassIds = classes?.map(c => c.classId) || [];
        } 
        else if (userRole === 'parent') {
          const { data: classes } = await supabase
            .from('Student')
            .select('classId')
            .eq('parentId', userId);

          userClassIds = classes?.map(c => c.classId) || [];
        }

        // Filtrar eventos por clases del usuario o eventos sin clase (globales)
        if (userClassIds.length > 0) {
          query = query.or(`classId.is.null,classId.in.(${userClassIds.join(',')})`);
        } else {
          query = query.is('classId', null);
        }
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('startTime', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de eventos: ${error.message}`);
      }

      return { 
        data: data as Event[], 
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
 * Función para crear un nuevo evento
 */
export function useCreateEvent() {
  return useSupabaseMutation<CreateEventParams, { id: string }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Event')
        .insert({
          title: params.title,
          startTime: params.startTime,
          endTime: params.endTime,
          description: params.description,
          classId: params.classId
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear evento: ${error.message}`);
      }
      
      return data as { id: string };
    },
    {
      invalidateQueries: [['event', 'list']],
      onSuccess: () => {
        console.log('Evento creado exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar un evento existente
 */
export function useUpdateEvent() {
  return useSupabaseMutation<UpdateEventParams, { id: string }>(
    async (supabase, params) => {
      const { id, ...eventData } = params;
      
      const { data, error } = await supabase
        .from('Event')
        .update(eventData)
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar evento: ${error.message}`);
      }
      
      return data as { id: string };
    },
    {
      invalidateQueries: [['event', 'list']],
      onSuccess: () => {
        console.log('Evento actualizado exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar un evento
 */
export function useDeleteEvent() {
  return useSupabaseMutation<{ id: string }, void>(
    async (supabase, { id }) => {
      const { error } = await supabase
        .from('Event')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar evento: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['event', 'list']],
      onSuccess: () => {
        console.log('Evento eliminado exitosamente');
      }
    }
  );
} 