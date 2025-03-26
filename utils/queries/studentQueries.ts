'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Student, StudentListParams, StudentListResult, CreateStudentParams, UpdateStudentParams } from '@/utils/types';

/**
 * Hook para obtener la lista de estudiantes con filtrado y paginación
 */
export function useStudentList(params: StudentListParams) {
  const { page, search, classId, gradeId, parentId } = params;
  
  return useSupabaseQuery<StudentListResult>(
    ['student', 'list', page, search, classId, gradeId, parentId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Student')
        .select(`
          *,
          Grade(id, level),
          Class(id, name),
          Parent(id, name, surname)
        `, { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Filtrar por clase
      if (classId) {
        query = query.eq('classId', classId);
      }

      // Filtrar por grado
      if (gradeId) {
        query = query.eq('gradeId', gradeId);
      }

      // Filtrar por padre/madre
      if (parentId) {
        query = query.eq('parentId', parentId);
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('surname');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de estudiantes: ${error.message}`);
      }

      return { 
        data: data as Student[], 
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
 * Función para crear un nuevo estudiante
 */
export function useCreateStudent() {
  return useSupabaseMutation<CreateStudentParams, { id: string }>(
    async (supabase, params) => {
      // Verificar capacidad de la clase
      const { data: classData, error: classError } = await supabase
        .from('Class')
        .select('id, capacity')
        .eq('id', params.classId)
        .single();
        
      if (classError) {
        throw new Error(`Error al verificar la clase: ${classError.message}`);
      }
      
      const { count: studentCount, error: countError } = await supabase
        .from('Student')
        .select('id', { count: 'exact', head: true })
        .eq('classId', params.classId);
        
      if (countError) {
        throw new Error(`Error al contar estudiantes: ${countError.message}`);
      }
      
      if (classData.capacity === studentCount) {
        throw new Error('La clase ha alcanzado su capacidad máxima');
      }
      
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email || `${params.username}@example.com`,
        password: params.password || "",
        options: {
          data: {
            role: "student",
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
      
      // Crear registro en la tabla de students
      const { error: studentError } = await supabase
        .from('Student')
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
          birthday: params.birthday,
          gradeId: params.gradeId,
          classId: params.classId,
          parentId: params.parentId
        });
      
      if (studentError) {
        throw new Error(`Error al crear estudiante: ${studentError.message}`);
      }
      
      return { id: authData.user.id };
    },
    {
      invalidateQueries: [['student', 'list']],
      onSuccess: () => {
        console.log('Estudiante creado exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar un estudiante existente
 */
export function useUpdateStudent() {
  return useSupabaseMutation<UpdateStudentParams, { id: string }>(
    async (supabase, params) => {
      const { id, password, ...studentData } = params;
      
      // Actualizar usuario en Auth si hay nueva contraseña
      if (password) {
        const { error: authError } = await supabase.auth.updateUser({
          password
        });
        
        if (authError) {
          throw new Error(`Error al actualizar contraseña: ${authError.message}`);
        }
      }
      
      // Verificar capacidad de la clase si se está cambiando de clase
      if (studentData.classId) {
        // Obtener la clase actual del estudiante
        const { data: currentStudent, error: studentError } = await supabase
          .from('Student')
          .select('classId')
          .eq('id', id)
          .single();
          
        if (studentError) {
          throw new Error(`Error al obtener estudiante: ${studentError.message}`);
        }
        
        // Si está cambiando de clase, verificar capacidad
        if (currentStudent.classId !== studentData.classId) {
          const { data: classData, error: classError } = await supabase
            .from('Class')
            .select('id, capacity')
            .eq('id', studentData.classId)
            .single();
            
          if (classError) {
            throw new Error(`Error al verificar la clase: ${classError.message}`);
          }
          
          const { count: studentCount, error: countError } = await supabase
            .from('Student')
            .select('id', { count: 'exact', head: true })
            .eq('classId', studentData.classId);
            
          if (countError) {
            throw new Error(`Error al contar estudiantes: ${countError.message}`);
          }
          
          if (classData.capacity === studentCount) {
            throw new Error('La clase ha alcanzado su capacidad máxima');
          }
        }
      }
      
      // Actualizar registro en la tabla de students
      const { error: studentError } = await supabase
        .from('Student')
        .update(studentData)
        .eq('id', id);
      
      if (studentError) {
        throw new Error(`Error al actualizar estudiante: ${studentError.message}`);
      }
      
      return { id };
    },
    {
      invalidateQueries: [['student', 'list']],
      onSuccess: () => {
        console.log('Estudiante actualizado exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar un estudiante
 */
export function useDeleteStudent() {
  return useSupabaseMutation<{ id: string }, void>(
    async (supabase, { id }) => {
      // Verificar si tiene registros asociados antes de eliminar (opcional)
      // Por ejemplo, calificaciones, asistencias, etc.
      
      // Eliminar el registro de student
      const { error: studentError } = await supabase
        .from('Student')
        .delete()
        .eq('id', id);
      
      if (studentError) {
        throw new Error(`Error al eliminar estudiante: ${studentError.message}`);
      }
      
      // Eliminar el usuario de Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        throw new Error(`Error al eliminar usuario: ${authError.message}`);
      }
    },
    {
      invalidateQueries: [['student', 'list']],
      onSuccess: () => {
        console.log('Estudiante eliminado exitosamente');
      }
    }
  );
}