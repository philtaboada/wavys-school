'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Student, StudentListParams as OriginalStudentListParams, StudentListResult, CreateStudentParams, UpdateStudentParams } from '@/utils/types/student';

// Extender o redefinir StudentListParams para incluir rol y ID
export interface StudentListParams extends OriginalStudentListParams {
  userRole?: string;
  userId?: string;
}

export type StudentDetails = {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  address: string;
  img?: string | null;
  bloodType: string;
  sex: string;
  createdAt: Date;
  birthday: Date;
  parentId: string;
  classId: number;
  gradeId: number;
  class: {
    id: number;
    name: string;
    capacity: number;
    supervisorId: string | null;
    gradeId: number;
    _count: {
      lessons: number;
    }
  }
};

/**
 * Hook para obtener los detalles de un estudiante específico
 */
export function useStudentDetails(studentId: string) {
  return useSupabaseQuery<StudentDetails>(
    ['student', 'details', studentId],
    async (supabase) => {
      // 1. Obtener información básica del estudiante
      const { data: studentData, error: studentError } = await supabase
        .from('Student')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError || !studentData) {
        throw new Error(`Error al obtener datos del estudiante: ${studentError?.message || 'No se encontraron datos'}`);
      }

      // 2. Obtener información de la clase
      const { data: classData, error: classError } = await supabase
        .from('Class')
        .select('*')
        .eq('id', studentData.classId)
        .single();

      if (classError || !classData) {
        throw new Error(`Error al obtener datos de la clase: ${classError?.message || 'No se encontró la clase'}`);
      }

      // 3. Obtener conteo de lecciones para la clase
      const { count: lessonsCount, error: lessonsError } = await supabase
        .from('Lesson')
        .select('*', { count: 'exact', head: true })
        .eq('classId', classData.id);

      if (lessonsError) {
        throw new Error(`Error al obtener lecciones: ${lessonsError.message}`);
      }

      // Combinar toda la información
      const student: StudentDetails = {
        ...studentData,
        class: {
          ...classData,
          _count: {
            lessons: lessonsCount || 0
          }
        }
      };

      return student;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
}

/**
 * Hook para obtener la lista de estudiantes con filtrado y paginación
 */
export function useStudentList(params: StudentListParams) {
  // Desestructurar todos los parámetros, incluyendo los nuevos
  const { page, search, classId, gradeId, parentId, userRole, userId } = params; 

  return useSupabaseQuery<StudentListResult>(
    // Actualizar la queryKey para incluir userRole y userId
    ['student', 'list', page, search, classId, gradeId, parentId, userRole, userId],
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

      // --- Inicio: Lógica de filtrado por Rol (copiada y adaptada de getStudents) ---
      let teacherClassIds: number[] | null = null; // Para almacenar los IDs si es profesor

      if (userRole === 'teacher' && userId) {
        console.log(`[useStudentList Debug] Applying TEACHER filter for userId: ${userId}`);
        const { data: lessonData, error: lessonError } = await supabase
          .from('Lesson')
          .select('classId')
          .eq('teacherId', userId);

        if (lessonError) {
          console.error("Client-side error fetching teacher's classes:", lessonError);
          // Lanzar error o devolver vacío? Coincidamos con servidor: devolver vacío.
          // throw new Error(`Error fetching teacher's classes: ${lessonError.message}`);
           return { data: [], count: 0 }; // Devolver vacío si falla la obtención de clases
        }

        if (!lessonData || lessonData.length === 0) {
          console.log(`[useStudentList Debug] Teacher ${userId} has no assigned lessons.`);
          return { data: [], count: 0 }; // Profesor no tiene clases
        }

        teacherClassIds = Array.from(new Set(lessonData.map(lesson => lesson.classId).filter(id => id != null)));

        if (teacherClassIds.length === 0) {
            console.log(`[useStudentList Debug] No valid class IDs found for teacher ${userId}.`);
            return { data: [], count: 0 }; // No hay IDs válidos
        }
         console.log(`[useStudentList Debug] Teacher class IDs:`, teacherClassIds);
         // Aplicaremos el filtro .in() más abajo, después de otros filtros

      } else if (userRole && userRole !== 'admin') {
          console.warn(`[useStudentList Debug] User role "${userRole}" has restricted access.`);
          return { data: [], count: 0 }; // Otros roles no admin/teacher no ven nada
      } else {
          console.log(`[useStudentList Debug] Applying NO role filter (likely admin): ${userRole}`);
      }
      // --- Fin: Lógica de filtrado por Rol ---

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

      // Aplicar filtro de clase de profesor DESPUÉS de otros filtros
      if (teacherClassIds !== null) {
        query = query.in('classId', teacherClassIds);
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

      // No intentamos eliminar el usuario de Auth desde el cliente
      // En su lugar, llamamos a una API del servidor para manejar esto
      try {
        const response = await fetch(`/api/delete-user?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('No se pudo eliminar el usuario de Auth, pero el estudiante fue eliminado:', errorData);
          // No lanzamos error aquí para que la UI considere exitosa la eliminación del estudiante
        }
      } catch (error) {
        console.warn('Error al llamar a la API para eliminar usuario:', error);
        // Igualmente no lanzamos error para que la UI considere exitosa la eliminación
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