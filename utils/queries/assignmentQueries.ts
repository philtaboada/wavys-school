'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Assignment, AssignmentListParams, AssignmentListResult } from '@/utils/types';

/**
 * Hook para obtener la lista de asignaciones con filtrado y paginación
 */
export function useAssignmentList(params: AssignmentListParams) {
  const { page, search, classId, teacherId, userId, role } = params;
  
  return useSupabaseQuery<AssignmentListResult>(
    ['assignment', 'list', page, search, classId, teacherId, role, userId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Assignment')
        .select(`
          id,
          title,
          startDate,
          dueDate,
          lessonId,
          Lesson:lessonId (
            id,
            name,
            subjectId,
            classId,
            teacherId
          )
        `, { count: 'exact' });

      // Aplicar filtros específicos
      if (classId) {
        // Obtenemos tareas donde la lección pertenece a una clase específica
        const { data: lessonIds, error: lessonError } = await supabase
          .from('Lesson')
          .select('id')
          .eq('classId', classId);
        
        if (!lessonError && lessonIds && lessonIds.length > 0) {
          const ids = lessonIds.map(l => l.id);
          query = query.in('lessonId', ids);
        }
      }

      if (teacherId) {
        // Obtenemos tareas donde la lección está asignada a un profesor específico
        const { data: lessonIds, error: lessonError } = await supabase
          .from('Lesson')
          .select('id')
          .eq('teacherId', teacherId);
        
        if (!lessonError && lessonIds && lessonIds.length > 0) {
          const ids = lessonIds.map(l => l.id);
          query = query.in('lessonId', ids);
        }
      }

      // Aplicar filtros según el rol
      if (role === "teacher" && userId) {
        // Obtenemos tareas donde el profesor es el usuario actual
        const { data: lessonIds, error: lessonError } = await supabase
          .from('Lesson')
          .select('id')
          .eq('teacherId', userId);
        
        if (!lessonError && lessonIds && lessonIds.length > 0) {
          const ids = lessonIds.map(l => l.id);
          query = query.in('lessonId', ids);
        } else {
          return { data: [], count: 0 };
        }
      } else if (role === "student" && userId) {
        // Obtenemos la clase del estudiante
        const { data: studentData, error: studentError } = await supabase
          .from('Student')
          .select('classId')
          .eq('id', userId)
          .single();
        
        if (studentData) {
          // Obtenemos lecciones de la clase del estudiante
          const { data: lessonIds, error: lessonError } = await supabase
            .from('Lesson')
            .select('id')
            .eq('classId', studentData.classId);
          
          if (!lessonError && lessonIds && lessonIds.length > 0) {
            const ids = lessonIds.map(l => l.id);
            query = query.in('lessonId', ids);
          } else {
            return { data: [], count: 0 };
          }
        } else {
          return { data: [], count: 0 };
        }
      } else if (role === "parent" && userId) {
        // Obtenemos los estudiantes asignados al padre
        const { data: parentStudents, error: parentError } = await supabase
          .from('Student')
          .select('id, classId')
          .eq('parentId', userId);
        
        if (parentStudents && parentStudents.length > 0) {
          // Obtenemos las clases de los estudiantes
          const classIds = parentStudents.map(student => student.classId);
          
          // Obtenemos lecciones de las clases de los estudiantes
          const { data: lessonIds, error: lessonError } = await supabase
            .from('Lesson')
            .select('id')
            .in('classId', classIds);
          
          if (!lessonError && lessonIds && lessonIds.length > 0) {
            const ids = lessonIds.map(l => l.id);
            query = query.in('lessonId', ids);
          } else {
            return { data: [], count: 0 };
          }
        } else {
          return { data: [], count: 0 };
        }
      }

      // Aplicar filtros de búsqueda
      if (search) {
        // Buscar por título de tarea
        query = query.ilike('title', `%${search}%`);
      }

      // Paginación
      query = query
        .range((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE - 1)
        .order('id', { ascending: false });

      // Ejecutar la consulta
      const { data: assignmentData, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener datos de tareas: ${error.message}`);
      }

      // Formatear los datos para la vista
      let data: Assignment[] = [];
      
      if (assignmentData && assignmentData.length > 0) {
        // Convertir los datos de Supabase al formato que espera nuestro componente
        data = assignmentData.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          startDate: assignment.startDate,
          dueDate: assignment.dueDate,
          lessonId: assignment.lessonId,
          lesson: null // Inicialmente vacío, se llenará más adelante
        }));
        
        // 1. Obtener todos los IDs de lecciones únicos
        const lessonIds = assignmentData
          .filter(assignment => assignment.lessonId)
          .map(assignment => assignment.lessonId)
          .filter((id, index, self) => self.indexOf(id) === index);
        
        // 2. Cargar información de lecciones
        if (lessonIds.length > 0) {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('Lesson')
            .select('id, name, subjectId, classId, teacherId')
            .in('id', lessonIds);
          
          if (!lessonsError && lessonsData) {
            // Crear un mapa para un acceso rápido a las lecciones por ID
            const lessonMap = new Map();
            lessonsData.forEach(lesson => {
              lessonMap.set(lesson.id, {
                id: lesson.id,
                name: lesson.name,
                subjectId: lesson.subjectId,
                classId: lesson.classId,
                teacherId: lesson.teacherId
              });
            });
            
            // 3. Cargar información de asignaturas, clases y profesores
            const subjectIds = lessonsData
              .filter(l => l.subjectId)
              .map(l => l.subjectId)
              .filter((id, index, self) => self.indexOf(id) === index);
              
            const classIds = lessonsData
              .filter(l => l.classId)
              .map(l => l.classId)
              .filter((id, index, self) => self.indexOf(id) === index);
              
            const teacherIds = lessonsData
              .filter(l => l.teacherId)
              .map(l => l.teacherId)
              .filter((id, index, self) => self.indexOf(id) === index);
            
            // Cargar asignaturas
            if (subjectIds.length > 0) {
              const { data: subjectsData } = await supabase
                .from('Subject')
                .select('id, name')
                .in('id', subjectIds);
              
              if (subjectsData) {
                const subjectMap = new Map();
                subjectsData.forEach(subject => {
                  subjectMap.set(subject.id, { id: subject.id, name: subject.name });
                });
                
                // Asignar asignaturas a lecciones
                lessonMap.forEach((lesson, lessonId) => {
                  if (lesson.subjectId && subjectMap.has(lesson.subjectId)) {
                    const lessonWithSubject = {
                      ...lesson,
                      subject: subjectMap.get(lesson.subjectId)
                    };
                    lessonMap.set(lessonId, lessonWithSubject);
                  }
                });
              }
            }
            
            // Cargar clases
            if (classIds.length > 0) {
              const { data: classesData } = await supabase
                .from('Class')
                .select('id, name')
                .in('id', classIds);
              
              if (classesData) {
                const classMap = new Map();
                classesData.forEach(cls => {
                  classMap.set(cls.id, { id: cls.id, name: cls.name });
                });
                
                // Asignar clases a lecciones
                lessonMap.forEach((lesson, lessonId) => {
                  if (lesson.classId && classMap.has(lesson.classId)) {
                    const lessonWithClass = {
                      ...lesson,
                      class: classMap.get(lesson.classId)
                    };
                    lessonMap.set(lessonId, lessonWithClass);
                  }
                });
              }
            }
            
            // Cargar profesores
            if (teacherIds.length > 0) {
              const { data: teachersData } = await supabase
                .from('Teacher')
                .select('id, name, surname')
                .in('id', teacherIds);
              
              if (teachersData) {
                const teacherMap = new Map();
                teachersData.forEach(teacher => {
                  teacherMap.set(teacher.id, { 
                    id: teacher.id, 
                    name: teacher.name,
                    surname: teacher.surname 
                  });
                });
                
                // Asignar profesores a lecciones
                lessonMap.forEach((lesson, lessonId) => {
                  if (lesson.teacherId && teacherMap.has(lesson.teacherId)) {
                    const lessonWithTeacher = {
                      ...lesson,
                      teacher: teacherMap.get(lesson.teacherId)
                    };
                    lessonMap.set(lessonId, lessonWithTeacher);
                  }
                });
              }
            }
            
            // 4. Asignar lecciones completas a las tareas
            for (let i = 0; i < data.length; i++) {
              const assignment = data[i];
              if (assignment.lessonId && lessonMap.has(assignment.lessonId)) {
                data[i] = {
                  ...assignment,
                  lesson: lessonMap.get(assignment.lessonId)
                };
              }
            }
          }
        }
      }

      return { 
        data: data, 
        count: count || 0 
      };
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
}

// Tipos para mutaciones
type CreateAssignmentParams = {
  title: string;
  startDate?: string;
  dueDate?: string;
  lessonId: number;
};

type UpdateAssignmentParams = {
  id: number;
  title?: string;
  startDate?: string;
  dueDate?: string;
  lessonId?: number;
};

/**
 * Función para crear una nueva tarea
 */
export function useCreateAssignment() {
  return useSupabaseMutation<CreateAssignmentParams, { id: number }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Assignment')
        .insert(params)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear tarea: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['assignment', 'list']],
      onSuccess: () => {
        // Aquí podrías mostrar una notificación de éxito
        console.log('Tarea creada exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar una tarea existente
 */
export function useUpdateAssignment() {
  return useSupabaseMutation<UpdateAssignmentParams, { id: number }>(
    async (supabase, params) => {
      const { id, ...rest } = params;
      
      const { data, error } = await supabase
        .from('Assignment')
        .update(rest)
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar tarea: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['assignment', 'list']],
      onSuccess: () => {
        // Aquí podrías mostrar una notificación de éxito
        console.log('Tarea actualizada exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar una tarea
 */
export function useDeleteAssignment() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      const { error } = await supabase
        .from('Assignment')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar tarea: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['assignment', 'list']],
      onSuccess: () => {
        // Aquí podrías mostrar una notificación de éxito
        console.log('Tarea eliminada exitosamente');
      }
    }
  );
} 