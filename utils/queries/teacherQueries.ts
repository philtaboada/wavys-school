'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';

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
  birthday: string;
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
        // Crear una promesa con timeout para la consulta
        const fetchWithTimeout = async (timeoutMs = 10000) => {
          let timer: NodeJS.Timeout | undefined;
          
          // Crear una promesa que rechaza después del timeout
          const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => {
              reject(new Error(`La consulta ha excedido el tiempo máximo de ${timeoutMs}ms`));
            }, timeoutMs);
          });
          
          try {
            // Ejecutar la consulta original en paralelo con el timeout
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

            const { data, error, count } = await Promise.race([
              query,
              timeoutPromise
            ]) as any;

            if (error) {
              throw new Error(`Error al obtener datos de profesores: ${error.message}`);
            }

            return { 
              data: data || [], 
              count: count || 0 
            };
          } finally {
            clearTimeout(timer);
          }
        };

        // Ejecutar la consulta con timeout
        return await fetchWithTimeout();
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
  return useSupabaseMutation<TeacherDetails, { id: string }>(
    async (supabase, params) => {
      const { id, counts, ...rest } = params;
      
      const { data, error } = await supabase
        .from('Teacher')
        .update(rest)
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar profesor: ${error.message}`);
      }
      
      return data as { id: string };
    },
    {
      invalidateQueries: [['teacher', 'details'], ['teacher', 'list']],
      onSuccess: () => {
        console.log('Profesor actualizado exitosamente');
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
      // Primero creamos el profesor
      const { data, error } = await supabase
        .from('Teacher')
        .insert({
          username: params.username,
          name: params.name,
          surname: params.surname,
          email: params.email,
          phone: params.phone,
          address: params.address,
          bloodType: params.bloodType,
          sex: params.sex,
          birthday: params.birthday,
          img: params.img,
          imgPath: params.imgPath
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear profesor: ${error.message}`);
      }

      // Si se proporcionan asignaturas, las asignamos al profesor
      if (params.subjects && params.subjects.length > 0) {
        const teacherId = data.id;
        const subjectTeacherData = params.subjects.map((subjectId: number) => ({
          teacherId,
          subjectId
        }));
        
        const { error: subjectTeacherError } = await supabase
          .from('subject_teacher')
          .insert(subjectTeacherData);
        
        if (subjectTeacherError) {
          throw new Error(`Error al asignar materias: ${subjectTeacherError.message}`);
        }
      }
      
      return data as { id: string };
    },
    {
      invalidateQueries: [['teacher', 'list']],
      onSuccess: () => {
        console.log('Profesor creado exitosamente');
      }
    }
  );
}
