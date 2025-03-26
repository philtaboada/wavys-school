'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Subject, SubjectListParams, SubjectListResult, CreateSubjectParams, UpdateSubjectParams } from '@/utils/types/subject';

/**
 * Hook para obtener la lista de asignaturas con filtrado y paginación
 */
export function useSubjectList(params: SubjectListParams & { userRole?: string; userId?: string }) {
  const { page, search, teacherId, userRole, userId } = params;
  
  return useSupabaseQuery<SubjectListResult>(
    ['subject', 'list', page, search, teacherId, userRole, userId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Subject')
        .select('*', { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Filtrar por profesor
      if (teacherId) {
        // Obtener asignaturas del profesor específico
        const { data: teacherSubjects } = await supabase
          .from('subject_teacher')
          .select('subjectId')
          .eq('teacherId', teacherId);
        
        if (teacherSubjects && teacherSubjects.length > 0) {
          const subjectIds = teacherSubjects.map(ts => ts.subjectId);
          query = query.in('id', subjectIds);
        } else {
          return { data: [], count: 0 };
        }
      }

      // Filtros específicos según el rol del usuario
      if (userRole && userRole !== 'admin' && userId) {
        if (userRole === 'teacher') {
          // Si el usuario es profesor, mostrar solo sus asignaturas
          const { data: teacherSubjects } = await supabase
            .from('subject_teacher')
            .select('subjectId')
            .eq('teacherId', userId);
          
          if (teacherSubjects && teacherSubjects.length > 0) {
            const subjectIds = teacherSubjects.map(ts => ts.subjectId);
            query = query.in('id', subjectIds);
          } else {
            return { data: [], count: 0 };
          }
        } 
        else if (userRole === 'student') {
          // Si el usuario es estudiante, mostrar las asignaturas de su clase
          const { data: studentData } = await supabase
            .from('Student')
            .select('classId')
            .eq('id', userId)
            .single();
          
          if (studentData && studentData.classId) {
            // Obtener las asignaturas asignadas a esta clase
            const { data: classSubjects } = await supabase
              .from('ClassSubject')
              .select('subjectId')
              .eq('classId', studentData.classId);
            
            if (classSubjects && classSubjects.length > 0) {
              const subjectIds = classSubjects.map(cs => cs.subjectId);
              query = query.in('id', subjectIds);
            } else {
              return { data: [], count: 0 };
            }
          } else {
            return { data: [], count: 0 };
          }
        } 
        else if (userRole === 'parent') {
          // Si el usuario es padre, mostrar las asignaturas de sus hijos
          const { data: parentStudents } = await supabase
            .from('Student')
            .select('classId')
            .eq('parentId', userId);
          
          if (parentStudents && parentStudents.length > 0) {
            const classIds = parentStudents.map(student => student.classId);
            // Obtener asignaturas para estas clases
            const { data: classSubjects } = await supabase
              .from('ClassSubject')
              .select('subjectId')
              .in('classId', classIds);
            
            if (classSubjects && classSubjects.length > 0) {
              const subjectIds = classSubjects.map(cs => cs.subjectId);
              query = query.in('id', subjectIds);
            } else {
              return { data: [], count: 0 };
            }
          } else {
            return { data: [], count: 0 };
          }
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

      // Obtener profesores para cada asignatura
      const result: Subject[] = [];
      
      for (const subject of data as Subject[]) {
        // Obtener los IDs de profesores asociados a esta asignatura
        const { data: teacherSubjects, error: relationError } = await supabase
          .from('subject_teacher')
          .select('teacherId')
          .eq('subjectId', subject.id);
        
        if (relationError) {
          throw new Error(`Error al obtener relaciones de profesores: ${relationError.message}`);
        }
        
        let teachers: {id: string; name: string; surname: string}[] = [];
        
        if (teacherSubjects && teacherSubjects.length > 0) {
          const teacherIds = teacherSubjects.map(ts => ts.teacherId);
          
          const { data: teachersData, error: teachersError } = await supabase
            .from('Teacher')
            .select('id, name, surname')
            .in('id', teacherIds);
          
          if (teachersError) {
            throw new Error(`Error al obtener datos de profesores: ${teachersError.message}`);
          }
          
          if (teachersData) {
            teachers = teachersData;
          }
        }
        
        result.push({
          ...subject,
          teachers
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
 * Función para crear una nueva asignatura
 */
export function useCreateSubject() {
  return useSupabaseMutation<CreateSubjectParams, { id: number }>(
    async (supabase, params) => {
      const { name, teachers } = params;
      
      // Crear la asignatura
      const { data, error } = await supabase
        .from('Subject')
        .insert({ name })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear asignatura: ${error.message}`);
      }
      
      // Si hay profesores seleccionados, crear las relaciones
      if (teachers && teachers.length > 0 && data.id) {
        const teacherSubjects = teachers.map(teacherId => ({
          teacherId,
          subjectId: data.id
        }));
        
        const { error: relationError } = await supabase
          .from('subject_teacher')
          .insert(teacherSubjects);
        
        if (relationError) {
          throw new Error(`Error al asignar profesores: ${relationError.message}`);
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
      
      // Actualizar datos básicos de la asignatura
      const { data, error } = await supabase
        .from('Subject')
        .update({ name })
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar asignatura: ${error.message}`);
      }
      
      // Si se proporcionaron profesores, actualizar las relaciones
      if (teachers !== undefined) {
        // Primero eliminar todas las relaciones existentes
        const { error: deleteError } = await supabase
          .from('subject_teacher')
          .delete()
          .eq('subjectId', id);
        
        if (deleteError) {
          throw new Error(`Error al eliminar relaciones antiguas: ${deleteError.message}`);
        }
        
        // Si hay nuevos profesores, crear las nuevas relaciones
        if (teachers.length > 0) {
          const teacherSubjects = teachers.map(teacherId => ({
            teacherId,
            subjectId: id
          }));
          
          const { error: insertError } = await supabase
            .from('subject_teacher')
            .insert(teacherSubjects);
          
          if (insertError) {
            throw new Error(`Error al asignar nuevos profesores: ${insertError.message}`);
          }
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
      // Eliminar todas las relaciones de esta asignatura
      const { error: relationError } = await supabase
        .from('subject_teacher')
        .delete()
        .eq('subjectId', id);
      
      if (relationError) {
        throw new Error(`Error al eliminar relaciones de profesores: ${relationError.message}`);
      }
      
      // Eliminar relaciones con clases
      const { error: classRelationError } = await supabase
        .from('ClassSubject')
        .delete()
        .eq('subjectId', id);
      
      if (classRelationError) {
        throw new Error(`Error al eliminar relaciones de clases: ${classRelationError.message}`);
      }
      
      // Finalmente eliminar la asignatura
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