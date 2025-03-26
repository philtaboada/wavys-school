'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Teacher, TeacherListParams, TeacherListResult, CreateTeacherParams, UpdateTeacherParams } from '@/utils/types';

/**
 * Hook para obtener la lista de profesores con filtrado y paginación
 */
export function useTeacherList(params: TeacherListParams) {
  const { page, search, subjectId } = params;
  
  return useSupabaseQuery<TeacherListResult>(
    ['teacher', 'list', page, search, subjectId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Teacher')
        .select('*', { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Filtrar por asignatura
      if (subjectId) {
        const { data: subjectTeachers } = await supabase
          .from('subject_teacher')
          .select('teacherId')
          .eq('subjectId', subjectId);
        
        if (subjectTeachers && subjectTeachers.length > 0) {
          const teacherIds = subjectTeachers.map(t => t.teacherId);
          query = query.in('id', teacherIds);
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
        throw new Error(`Error al obtener datos de profesores: ${error.message}`);
      }

      // Obtener asignaturas relacionadas
      const result: Teacher[] = [];
      
      for (const teacher of data as Teacher[]) {
        const { data: subjectRelations } = await supabase
          .from('subject_teacher')
          .select('subjectId')
          .eq('teacherId', teacher.id);
        
        if (subjectRelations && subjectRelations.length > 0) {
          const subjectIds = subjectRelations.map(rel => rel.subjectId);
          
          const { data: subjects } = await supabase
            .from('Subject')
            .select('id, name')
            .in('id', subjectIds);
          
          result.push({
            ...teacher,
            subjects: subjects || []
          });
        } else {
          result.push({
            ...teacher,
            subjects: []
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
 * Función para crear un nuevo profesor
 */
export function useCreateTeacher() {
  return useSupabaseMutation<CreateTeacherParams, { id: string }>(
    async (supabase, params) => {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email || `${params.username}@example.com`,
        password: params.password || "",
        options: {
          data: {
            role: "teacher",
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
      
      // Crear registro en la tabla de teachers
      const { error: teacherError } = await supabase
        .from('Teacher')
        .insert({
          id: authData.user.id,
          username: params.username,
          name: params.name,
          surname: params.surname,
          email: params.email || null,
          phone: params.phone || null,
          address: params.address,
          img: params.img || null,
          imgPath: params.imgPath || null,
          bloodType: params.bloodType,
          sex: params.sex,
          birthday: params.birthday
        });
      
      if (teacherError) {
        throw new Error(`Error al crear profesor: ${teacherError.message}`);
      }
      
      // Relacionar con asignaturas
      if (params.subjects && params.subjects.length > 0) {
        const subjectConnections = params.subjects.map(subjectId => ({
          teacherId: authData.user?.id,
          subjectId
        }));
        
        const { error: relationError } = await supabase
          .from('subject_teacher')
          .insert(subjectConnections);
        
        if (relationError) {
          throw new Error(`Error al relacionar asignaturas: ${relationError.message}`);
        }
      }
      
      return { id: authData.user.id };
    },
    {
      invalidateQueries: [['teacher', 'list']],
      onSuccess: () => {
        console.log('Profesor creado exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar un profesor existente
 */
export function useUpdateTeacher() {
  return useSupabaseMutation<UpdateTeacherParams, { id: string }>(
    async (supabase, params) => {
      const { id, password, subjects, ...teacherData } = params;
      
      // Actualizar usuario en Auth si hay nueva contraseña
      if (password) {
        const { error: authError } = await supabase.auth.updateUser({
          password
        });
        
        if (authError) {
          throw new Error(`Error al actualizar contraseña: ${authError.message}`);
        }
      }
      
      // Actualizar registro en la tabla de teachers
      const { error: teacherError } = await supabase
        .from('Teacher')
        .update(teacherData)
        .eq('id', id);
      
      if (teacherError) {
        throw new Error(`Error al actualizar profesor: ${teacherError.message}`);
      }
      
      // Actualizar relaciones con asignaturas
      if (subjects !== undefined) {
        // Eliminar relaciones existentes
        const { error: deleteError } = await supabase
          .from('subject_teacher')
          .delete()
          .eq('teacherId', id);
          
        if (deleteError) {
          throw new Error(`Error al eliminar relaciones: ${deleteError.message}`);
        }
        
        // Crear nuevas relaciones
        if (subjects.length > 0) {
          const subjectConnections = subjects.map(subjectId => ({
            teacherId: id,
            subjectId
          }));
          
          const { error: relationError } = await supabase
            .from('subject_teacher')
            .insert(subjectConnections);
          
          if (relationError) {
            throw new Error(`Error al crear nuevas relaciones: ${relationError.message}`);
          }
        }
      }
      
      return { id };
    },
    {
      invalidateQueries: [['teacher', 'list']],
      onSuccess: () => {
        console.log('Profesor actualizado exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar un profesor
 */
export function useDeleteTeacher() {
  return useSupabaseMutation<{ id: string }, void>(
    async (supabase, { id }) => {
      // Eliminar relaciones primero
      const { error: relationError } = await supabase
        .from('subject_teacher')
        .delete()
        .eq('teacherId', id);
        
      if (relationError) {
        throw new Error(`Error al eliminar relaciones: ${relationError.message}`);
      }
      
      // Eliminar el registro de teacher
      const { error: teacherError } = await supabase
        .from('Teacher')
        .delete()
        .eq('id', id);
      
      if (teacherError) {
        throw new Error(`Error al eliminar profesor: ${teacherError.message}`);
      }
      
      // Eliminar el usuario de Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        throw new Error(`Error al eliminar usuario: ${authError.message}`);
      }
    },
    {
      invalidateQueries: [['teacher', 'list']],
      onSuccess: () => {
        console.log('Profesor eliminado exitosamente');
      }
    }
  );
}