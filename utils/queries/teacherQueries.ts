'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { useQueryClient } from '@tanstack/react-query';

export type TeacherDetails = {
  id: string;
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
  description?: string | null;
  counts: {
    subjects: number;
    lessons: number;
    classes: number;
    attendance: number;
  };
};

// Tipo para los parámetros de creación de profesor
export interface CreateTeacherParams {
  username: string;
  name: string;
  surname: string;
  email?: string;
  password?: string;
  phone?: string;
  address: string;
  bloodType: string;
  sex: string;
  birthday: string | null;
  img?: string;
  imgPath?: string;
  subjects?: number[];
}

/**
 * Hook para obtener la lista de profesores con filtrado y paginación
 */
export function useTeacherList(params: { page: number; search?: string; userRole?: string; userId?: string }) {
  const { page, search, userRole, userId } = params;

  return useSupabaseQuery<{ data: any[]; count: number }>(
    ['teacher', 'list', page, search, userRole, userId],
    async (supabase) => {
      try {
        // Ejecutar la consulta sin timeout
        const fetchData = async () => {
          // Construir la consulta base
          let query = supabase
            .from('Teacher')
            .select('*', { count: 'exact' });

          // Aplicar filtros de búsqueda
          if (search) {
            query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%,email.ilike.%${search}%`);
          }

          // Filtros específicos según el rol del usuario
          if (userRole && userRole !== 'admin' && userId) {
            if (userRole === 'teacher') {
              // Si el usuario es profesor, solo puede ver su propio perfil
              query = query.eq('id', userId);
            }
            else if (userRole === 'student') {
              // Obtener los profesores de las clases a las que pertenece el estudiante
              const { data: studentData } = await supabase
                .from('Student')
                .select('classId')
                .eq('id', userId)
                .single();

              if (studentData && studentData.classId) {
                // Obtener lecciones de la clase del estudiante
                const { data: lessonsData } = await supabase
                  .from('Lesson')
                  .select('teacherId')
                  .eq('classId', studentData.classId);

                if (lessonsData && lessonsData.length > 0) {
                  const teacherIds = lessonsData.map(lesson => lesson.teacherId);
                  query = query.in('id', teacherIds);
                } else {
                  return { data: [], count: 0 };
                }
              } else {
                return { data: [], count: 0 };
              }
            }
            else if (userRole === 'parent') {
              // Obtener los estudiantes del padre
              const { data: parentStudents } = await supabase
                .from('Student')
                .select('classId')
                .eq('parentId', userId);

              if (parentStudents && parentStudents.length > 0) {
                const classIds = parentStudents.map(student => student.classId);

                // Obtener lecciones de las clases de los estudiantes
                const { data: lessonsData } = await supabase
                  .from('Lesson')
                  .select('teacherId')
                  .in('classId', classIds);

                if (lessonsData && lessonsData.length > 0) {
                  const teacherIds = lessonsData.map(lesson => lesson.teacherId);
                  query = query.in('id', teacherIds);
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
            .order('surname');

          const { data, error, count } = await query;

          if (error) {
            throw new Error(`Error al obtener datos de profesores: ${error.message}`);
          }

          return {
            data: data || [],
            count: count || 0
          };
        };

        // Ejecutar la consulta
        return await fetchData();
      } catch (error) {
        console.error("Error en useTeacherList:", error);
        throw error;
      }
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
}

/**
 * Hook para obtener los detalles de un profesor específico
 */
export function useTeacherDetails(teacherId: string) {
  return useSupabaseQuery<TeacherDetails>(
    ['teacher', 'details', teacherId],
    async (supabase) => {
      // 1. Obtener información básica del profesor
      const { data: teacherData, error: teacherError } = await supabase
        .from('Teacher')
        .select('*')
        .eq('id', teacherId)
        .single();

      if (teacherError || !teacherData) {
        throw new Error(`Error al obtener datos del profesor: ${teacherError?.message || 'No se encontraron datos'}`);
      }

      // 2. Obtener conteo de asignaturas del profesor
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subject_teacher')
        .select('subjectId, Subject(*)')
        .eq('teacherId', teacherId);

      if (subjectsError) {
        throw new Error(`Error al obtener asignaturas: ${subjectsError.message}`);
      }

      const subjectsCount = subjectsData?.length || 0;

      // 3. Obtener conteo de lecciones del profesor
      const { count: lessonsCount, error: lessonsError } = await supabase
        .from('Lesson')
        .select('*', { count: 'exact', head: true })
        .eq('teacherId', teacherId);

      if (lessonsError) {
        throw new Error(`Error al obtener lecciones: ${lessonsError.message}`);
      }

      // 4. Obtener conteo de clases del profesor
      const { count: classesCount, error: classesError } = await supabase
        .from('Class')
        .select('*', { count: 'exact', head: true })
        .eq('supervisorId', teacherId);

      if (classesError) {
        throw new Error(`Error al obtener clases: ${classesError.message}`);
      }

      // Combinar toda la información
      const teacher: TeacherDetails = {
        ...teacherData,
        counts: {
          subjects: subjectsCount,
          lessons: lessonsCount || 0,
          classes: classesCount || 0,
          attendance: 90 // Valor fijo por ahora, podría obtenerse de la base de datos
        }
      };

      return teacher;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
}

/**
 * Función para eliminar un profesor
 */
export function useDeleteTeacher() {
  return useSupabaseMutation<{ id: string }, void>(
    async (supabase, { id }) => {
      // Verificar si el profesor tiene clases asignadas como supervisor
      const { count: classesCount, error: classesError } = await supabase
        .from('Class')
        .select('id', { count: 'exact', head: true })
        .eq('supervisorId', id);

      if (classesError) {
        throw new Error(`Error al verificar clases supervisadas: ${classesError.message}`);
      }

      if (classesCount && classesCount > 0) {
        throw new Error(`No se puede eliminar al profesor porque supervisa ${classesCount} clases`);
      }

      // Verificar si el profesor tiene lecciones asignadas
      const { count: lessonsCount, error: lessonsError } = await supabase
        .from('Lesson')
        .select('id', { count: 'exact', head: true })
        .eq('teacherId', id);

      if (lessonsError) {
        throw new Error(`Error al verificar lecciones: ${lessonsError.message}`);
      }

      if (lessonsCount && lessonsCount > 0) {
        throw new Error(`No se puede eliminar al profesor porque tiene ${lessonsCount} lecciones asignadas`);
      }

      // Eliminar asignaciones de materias primero
      const { error: subjectTeacherError } = await supabase
        .from('subject_teacher')
        .delete()
        .eq('teacherId', id);

      if (subjectTeacherError) {
        throw new Error(`Error al eliminar asignaciones de materias: ${subjectTeacherError.message}`);
      }

      // Finalmente eliminar al profesor
      const { error } = await supabase
        .from('Teacher')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error al eliminar profesor: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['teacher', 'details'], ['teacher', 'list']],
      onSuccess: () => {
        console.log('Profesor eliminado exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar un profesor
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useSupabaseMutation<any, { id: string }>(
    async (supabase, params) => {
      const {
        id,
        subjects,
        password,
        email,
        createdAt,
        counts,
        ...teacherProfileData
      } = params;

      // 1. Actualizar datos de autenticación si se proporcionan
      const authUpdates: { email?: string; password?: string } = {};
      if (email) {
        authUpdates.email = email;
      }
      if (password && password.trim() !== '') {
        authUpdates.password = password;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authUpdateError } = await supabase.auth.updateUser(authUpdates);
        if (authUpdateError) {
          console.error(`Error al actualizar datos de Auth para el usuario ${id}:`, authUpdateError);
          throw new Error(`Error al actualizar la autenticación: ${authUpdateError.message}`);
        }
        console.log(`Datos de Auth actualizados para el usuario ${id}`);
      }

      // 2. Preparar datos para actualizar en la tabla Teacher
      const profileUpdatePayload = { ...teacherProfileData };
      if (email) profileUpdatePayload.email = email;
      if (params.username) profileUpdatePayload.username = params.username;

      // Actualizar perfil en la tabla Teacher (excluyendo campos no pertinentes como password, subjects, etc.)
      const { error: profileError } = await supabase
        .from('Teacher')
        .update(profileUpdatePayload)
        .eq('id', id);

      if (profileError) {
        console.error("Data sent for profile update:", profileUpdatePayload);
        throw new Error(`Error al actualizar perfil del profesor: ${profileError.message}`);
      }

      // 3. Actualizar asignaturas (método: borrar todo y reinsertar)
      if (subjects && Array.isArray(subjects)) {
        const newSubjectIds = subjects.map(s => {
          if (typeof s === 'object' && s !== null && s.id !== undefined) {
            return typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
          }
          return typeof s === 'string' ? parseInt(s, 10) : s;
        })
          .filter(id => typeof id === 'number' && !isNaN(id));
        // .map((s: any) => (typeof s === 'object' && s !== null && s.id !== undefined ? s.id : s))
        // .filter((id): id is number => typeof id === 'number' && Number.isInteger(id));

        console.log(`[useUpdateTeacher] Asignaturas procesadas para actualizar:`, newSubjectIds);

        // Borrar todas las asignaturas existentes para este profesor
        const { error: deleteError } = await supabase
          .from('subject_teacher')
          .delete()
          .eq('teacherId', id);

        if (deleteError) {
          console.error(`Error al borrar asignaturas existentes para teacher ${id}:`, deleteError);
          throw new Error(`Error al preparar actualización de asignaturas: ${deleteError.message}`);
        }

        // Insertar las nuevas asignaturas si hay alguna
        if (newSubjectIds.length > 0) {
          const insertData = newSubjectIds.map(subjectId => ({ teacherId: id, subjectId: subjectId }));

          console.log(`[useUpdateTeacher] Insertando nuevas asignaturas:`, insertData);

          const { error: addError } = await supabase
            .from('subject_teacher')
            .insert(insertData);

          if (addError) {
            console.error(`Error al insertar nuevas asignaturas para teacher ${id}:`, addError);
            throw new Error(`Error al asignar nuevas asignaturas: ${addError.message}`);
          }
        }
      }

      return { id };
    },
    {
      onSuccess: (data, variables) => {
        console.log(`Profesor ${variables.id} actualizado exitosamente`);
        queryClient.invalidateQueries({ queryKey: ['teacher', 'details', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['teacher', 'list'] });
      },
      onError: (error, variables) => {
        console.error(`Error completo al actualizar profesor ${variables.id}:`, error);
      }
    }
  );
}

/**
 * Función para crear un nuevo profesor
 */
export function useCreateTeacher() {
  return useSupabaseMutation<CreateTeacherParams, { id: string }>(
    async (supabase, params) => {

      //Extraer datos necesarios
      const { subjects = [], password, ...teacherData } = params;

      // 1. Validar datos requeridos
      if (!teacherData.email || !password || !teacherData.username) {
        throw new Error('Email, contraseña y usuario son obligatorios para crear un profesor.');
      }

      // 2. Crear el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: teacherData.email,
        password: password,
        options: {
          data: { // Metadatos van dentro de 'data'
            app_metadata: {
              role: 'teacher'
            }
          }
          // Otros campos como emailRedirectTo irían aquí si fueran necesarios
        }
      });

      if (authError) {
        throw new Error(`Error al crear usuario de autenticación: ${authError.message}`);
      }

      console.log('[useCreateTeacher] Auth signUp successful. User:', authData.user);

      // Asegurarse de que tenemos el ID del usuario
      if (!authData.user?.id) {
        console.error('[useCreateTeacher] Error: No user ID found after successful signUp.');
        throw new Error('No se pudo obtener el ID del usuario después del registro.');
      }

      const userId = authData.user.id;
      console.log(`[useCreateTeacher] User ID obtained: ${userId}`);

      //3. Insertar datos del profesor
      const { error: teacherError } = await supabase
        .from('Teacher')
        .insert([{
          ...teacherData,
          id: userId
        }]);

      if (teacherError) {
        //Si falla la insercion del profesor, elimina el usuario auth
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Error al insertar datos del profesor: ${teacherError.message}`);
      }

      // 4. Asignar materias si existen
      if (subjects && subjects.length > 0) {
        try {
          console.log("[useCreateTeacher] Procesando las asignaturas:", subjects);

          // Preparar los datos para la inserción usando snake_case para los nombres de columnas
          const subjectTeacherData = subjects.map(subjectId => ({
            teacherId: userId,  // Cambiado de teacherId a teacher_id
            subjectId: subjectId // Cambiado de subjectId a subject_id
          }));

          console.log('[useCreateTeacher] Insertar asignaturas relacionadas:', subjectTeacherData);

          // Insertar las relaciones profesor-asignatura
          const { error: subjectError } = await supabase
            .from('subject_teacher')
            .insert(subjectTeacherData);

          if (subjectError) {
            console.error('[useCreateTeacher] Error al asignar materias:', subjectError);
            // No lanzamos error para no revertir la creación del profesor
          } else {
            console.log('[useCreateTeacher] Subjects assigned successfully');
          }
        } catch (error) {
          console.error('[useCreateTeacher] Error al asignar materias:', error);
        }
      }

      return { id: userId };

      // 3. Preparar datos para insertar en la tabla Teacher
      // const teacherInsertData = {
      //   id: userId,
      //   username: params.username,
      //   name: params.name,
      //   surname: params.surname,
      //   email: params.email,
      //   phone: params.phone || null,
      //   address: params.address,
      //   bloodType: params.bloodType,
      //   sex: params.sex,
      //   birthday: params.birthday,
      //   // subjects: params.subjects || [],
      //   img: params.img || null,
      //   imgPath: params.imgPath || null
      // };

      // console.log('[useCreateTeacher] Data prepared for Teacher insert:', teacherInsertData);

      // 4. Intentar insertar en la tabla Teacher
      // console.log('[useCreateTeacher] Attempting to insert into Teacher table...');
      // const { error: teacherInsertError } = await supabase
      //   .from('Teacher')
      //   .insert([{
      //     ...teacherData,
      //     id: authData.user.id,
      //     img: img || null
      //   }]);
      // .select('id');

      // Verificar error de inserción
      // if (teacherInsertError) {
      //   console.error(`[useCreateTeacher] Error inserting teacher profile for user ${userId}:`, teacherInsertError);
      //   // Podríamos intentar eliminar el usuario de Auth aquí si la inserción del perfil falla
      //   await supabase.auth.admin.deleteUser(userId);
      //   // lanzamos el error.
      //   throw new Error(`Error al crear el perfil del profesor: ${teacherInsertError.message}`);
      // }

      // console.log(`[useCreateTeacher] Teacher profile inserted successfully for user ${userId}`);

      // 5. Asignar asignaturas si se proporcionan
      // if (params.subjects && params.subjects.length > 0) {
      //   const subjectTeacherData = params.subjects.map(subjectId => ({
      //     teacherId: userId, // Usar el userId
      //     subjectId: typeof subjectId === 'object' ? subjectId.id : subjectId
      //   }));

      //   const { error: subjectTeacherError } = await supabase
      //     .from('subject_teacher')
      //     .insert(subjectTeacherData);

      //   if (subjectTeacherError) {
      //     // Similar al error de inserción del perfil, podríamos revertir pasos anteriores.
      //     console.error(`Error al asignar materias al profesor ${userId}:`, subjectTeacherError);
      //     throw new Error(`Error al asignar materias: ${subjectTeacherError.message}`);
      //   }
      // }

      // 5. Retornar el ID del profesor (que es el userId)
      // return { id: userId };
    },
    {
      invalidateQueries: [['teacher', 'list']],
      onSuccess: (data) => {
        console.log(`Profesor con ID ${data.id} creado exitosamente (usuario y perfil).`);
      },
      onError: (error) => {
        // El error ya se lanzó y se registró en las etapas anteriores si ocurrió allí.
        console.error('Error general en el hook useCreateTeacher:', error);
      }
    }
  );
}
