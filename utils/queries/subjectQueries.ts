'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Subject, SubjectListParams, SubjectListResult, CreateSubjectParams, UpdateSubjectParams } from '@/utils/types';

/**
 * Hook para obtener la lista de asignaturas con filtrado y paginación
 */
export function useSubjectList(params: SubjectListParams) {
  const { page, search, teacherId } = params;
  
  return useSupabaseQuery<SubjectListResult>(
    ['subject', 'list', page, search, teacherId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Subject')
        .select('*', { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Filtrar por profesor si se proporciona
      if (teacherId) {
        const { data: teacherSubjects } = await supabase
          .from('subject_teacher')
          .select('subjectId')
          .eq('teacherId', teacherId);
        
        if (teacherSubjects && teacherSubjects.length > 0) {
          const subjectIds = teacherSubjects.map(s => s.subjectId);
          query = query.in('id', subjectIds);
        } else {
          return { data: [], count: 0 };
        }
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('name');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de asignaturas: ${error.message}`);
      }

      // Obtener profesores relacionados
      const result: Subject[] = [];
      
      for (const subject of data as Subject[]) {
        const { data: teacherRelations } = await supabase
          .from('subject_teacher')
          .select('teacherId')
          .eq('subjectId', subject.id);
        
        if (teacherRelations && teacherRelations.length > 0) {
          const teacherIds = teacherRelations.map(rel => rel.teacherId);
          
          const { data: teachers } = await supabase
            .from('Teacher')
            .select('id, name, surname')
            .in('id', teacherIds);
          
          result.push({
            ...subject,
            teachers: teachers || []
          });
        } else {
          result.push({
            ...subject,
            teachers: []
          });
        }
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
 * Función para crear una nueva asignatura
 */
export function useCreateSubject() {
  return useSupabaseMutation<CreateSubjectParams, { id: number }>(
    async (supabase, params) => {
      // Crear la asignatura
      const { data, error } = await supabase
        .from('Subject')
        .insert({ name: params.name })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear asignatura: ${error.message}`);
      }
      
      // Relacionar con profesores si se proporcionan
      if (params.teachers && params.teachers.length > 0) {
        const teacherConnections = params.teachers.map(teacherId => ({
          teacherId,
          subjectId: data.id
        }));
        
        const { error: relationError } = await supabase
          .from('subject_teacher')
          .insert(teacherConnections);
        
        if (relationError) {
          throw new Error(`Error al relacionar profesores: ${relationError.message}`);
        }
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['subject', 'list']],
      onSuccess: () => {
        console.log('Asignatura creada exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar una asignatura existente
 */
export function useUpdateSubject() {
  return useSupabaseMutation<UpdateSubjectParams, { id: number }>(
    async (supabase, params) => {
      const { id, name, teachers } = params;
      
      // Actualizar la asignatura
      const { data, error } = await supabase
        .from('Subject')
        .update({ name })
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar asignatura: ${error.message}`);
      }
      
      // Eliminar relaciones existentes
      const { error: deleteError } = await supabase
        .from('subject_teacher')
        .delete()
        .eq('subjectId', id);
        
      if (deleteError) {
        throw new Error(`Error al eliminar relaciones: ${deleteError.message}`);
      }
      
      // Crear nuevas relaciones
      if (teachers && teachers.length > 0) {
        const teacherConnections = teachers.map(teacherId => ({
          teacherId,
          subjectId: id
        }));
        
        const { error: relationError } = await supabase
          .from('subject_teacher')
          .insert(teacherConnections);
        
        if (relationError) {
          throw new Error(`Error al crear nuevas relaciones: ${relationError.message}`);
        }
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['subject', 'list']],
      onSuccess: () => {
        console.log('Asignatura actualizada exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar una asignatura
 */
export function useDeleteSubject() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      // Eliminar relaciones primero
      const { error: relationError } = await supabase
        .from('subject_teacher')
        .delete()
        .eq('subjectId', id);
        
      if (relationError) {
        throw new Error(`Error al eliminar relaciones: ${relationError.message}`);
      }
      
      // Eliminar la asignatura
      const { error } = await supabase
        .from('Subject')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar asignatura: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['subject', 'list']],
      onSuccess: () => {
        console.log('Asignatura eliminada exitosamente');
      }
    }
  );
}