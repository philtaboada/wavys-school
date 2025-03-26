'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Announcement, AnnouncementListParams, AnnouncementListResult, CreateAnnouncementParams, UpdateAnnouncementParams } from '@/utils/types';

/**
 * Hook para obtener la lista de anuncios con filtrado y paginación
 */
export function useAnnouncementList(params: AnnouncementListParams) {
  const { page, search, classId, startDate, endDate, global } = params;
  
  return useSupabaseQuery<AnnouncementListResult>(
    ['announcement', 'list', page, search, classId, startDate, endDate, global],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Announcement')
        .select(`
          *,
          Class(id, name, Grade(id, name))
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Filtrar por clase
      if (classId) {
        query = query.eq('classId', classId);
      }

      // Filtrar anuncios globales (sin clase asignada)
      if (global === true) {
        query = query.is('classId', null);
      }

      // Filtrar por fecha de inicio
      if (startDate) {
        query = query.gte('date', startDate);
      }

      // Filtrar por fecha de fin
      if (endDate) {
        query = query.lte('date', endDate);
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('date', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de anuncios: ${error.message}`);
      }

      return { 
        data: data as Announcement[], 
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
 * Hook para obtener anuncios relevantes para un estudiante específico
 */
export function useStudentAnnouncements(studentId: string, page: number = 1) {
  return useSupabaseQuery<AnnouncementListResult>(
    ['announcement', 'student', studentId, page],
    async (supabase) => {
      // Primero obtenemos la clase del estudiante
      const { data: student, error: studentError } = await supabase
        .from('Student')
        .select('classId')
        .eq('id', studentId)
        .single();
      
      if (studentError || !student) {
        throw new Error(`Error al obtener datos del estudiante: ${studentError?.message || 'No encontrado'}`);
      }
      
      // Luego obtenemos los anuncios globales y específicos de su clase
      const query = supabase
        .from('Announcement')
        .select(`
          *,
          Class(id, name, Grade(id, name))
        `, { count: 'exact' })
        .or(`classId.is.null,classId.eq.${student.classId}`)
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('date', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Error al obtener anuncios: ${error.message}`);
      }
      
      return {
        data: data as Announcement[],
        count: count || 0
      };
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
      enabled: !!studentId // Solo ejecutar si hay un ID de estudiante
    }
  );
}

/**
 * Función para crear un nuevo anuncio
 */
export function useCreateAnnouncement() {
  return useSupabaseMutation<CreateAnnouncementParams, { id: number }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Announcement')
        .insert({
          title: params.title,
          description: params.description,
          date: params.date,
          classId: params.classId || null
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear anuncio: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['announcement']],
      onSuccess: () => {
        console.log('Anuncio creado exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar un anuncio existente
 */
export function useUpdateAnnouncement() {
  return useSupabaseMutation<UpdateAnnouncementParams, { id: number }>(
    async (supabase, params) => {
      const { id, ...announcementData } = params;
      
      const { data, error } = await supabase
        .from('Announcement')
        .update(announcementData)
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar anuncio: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['announcement']],
      onSuccess: () => {
        console.log('Anuncio actualizado exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar un anuncio
 */
export function useDeleteAnnouncement() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      const { error } = await supabase
        .from('Announcement')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar anuncio: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['announcement']],
      onSuccess: () => {
        console.log('Anuncio eliminado exitosamente');
      }
    }
  );
}