'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';

// Tipos para modelos relacionados
export type Student = {
  id: string;
  name: string;
  surname: string;
};

export type Teacher = {
  id: string;
  name: string;
  surname: string;
};

export type Class = {
  id: number;
  name: string;
};

export type Lesson = {
  id: number;
  teacherId?: string;
  classId?: number;
  teacher?: Teacher;
  class?: Class;
};

export type Exam = {
  id: number;
  title: string;
  startTime: Date;
  lessonId: number;
  lesson?: Lesson;
};

export type Assignment = {
  id: number;
  title: string;
  startDate: Date;
  dueDate: Date;
  lessonId: number;
  lesson?: Lesson;
};

// Tipo de datos principal
export type Result = {
  id: number;
  score: number;
  studentId: string;
  examId?: number | null;
  assignmentId?: number | null;
  student?: Student;
  exam?: Exam;
  assignment?: Assignment;
};

// Tipos para la visualización en la interfaz
export type ResultDisplay = {
  id: number;
  title: string;
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  className: string;
  startTime: Date;
  isExam: boolean; // Para saber si es examen o tarea
};

// Tipos para los parámetros y resultados
export type ResultListParams = {
  page: number;
  search?: string;
  studentId?: string;
  examId?: number;
  assignmentId?: number;
};

export type ResultListResult = {
  data: ResultDisplay[];
  count: number;
};

export type CreateResultParams = {
  score: number;
  studentId: string;
  examId?: number;
  assignmentId?: number;
};

export type UpdateResultParams = {
  id: number;
  score: number;
};

/**
 * Hook para obtener la lista de resultados con filtrado y paginación
 */
export function useResultList(params: ResultListParams & { userRole?: string; userId?: string }) {
  const { page, search, studentId, examId, assignmentId, userRole, userId } = params;
  
  return useSupabaseQuery<ResultListResult>(
    ['result', 'list', page, search, studentId, examId, assignmentId, userRole, userId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Result')
        .select('*', { count: 'exact' });

      // Aplicar filtros específicos
      if (studentId) {
        query = query.eq('studentId', studentId);
      }

      if (examId) {
        query = query.eq('examId', examId);
      }

      if (assignmentId) {
        query = query.eq('assignmentId', assignmentId);
      }

      // Ejecutar la consulta principal
      const { data: resultsData, error: resultsError, count } = await query;

      if (resultsError) {
        throw new Error(`Error al obtener datos de resultados: ${resultsError.message}`);
      }

      // Si no hay resultados, retornar temprano
      if (!resultsData || resultsData.length === 0) {
        return { data: [], count: 0 };
      }

      // Mapear IDs para consultas adicionales
      const studentIds = resultsData
        .map(result => result.studentId)
        .filter((id, index, self) => self.indexOf(id) === index);
      
      const examIds = resultsData
        .filter(result => result.examId)
        .map(result => result.examId)
        .filter((id, index, self) => self.indexOf(id) === index);
      
      const assignmentIds = resultsData
        .filter(result => result.assignmentId)
        .map(result => result.assignmentId)
        .filter((id, index, self) => self.indexOf(id) === index);
      
      // 1. Cargar datos de estudiantes
      const studentMap = new Map<string, Student>();
      if (studentIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from('Student')
          .select('id, name, surname')
          .in('id', studentIds);
        
        if (studentsError) {
          throw new Error(`Error al obtener datos de estudiantes: ${studentsError.message}`);
        }
        
        if (studentsData) {
          studentsData.forEach(student => {
            studentMap.set(student.id, { 
              id: student.id, 
              name: student.name, 
              surname: student.surname 
            });
          });
        }
      }
      
      // 2. Cargar datos de exámenes y sus relaciones
      const examMap = new Map<number, Exam>();
      const examLessonIds: number[] = [];
      if (examIds.length > 0) {
        const { data: examsData, error: examsError } = await supabase
          .from('Exam')
          .select('id, title, startTime, lessonId')
          .in('id', examIds);
        
        if (examsError) {
          throw new Error(`Error al obtener datos de exámenes: ${examsError.message}`);
        }
        
        if (examsData) {
          examsData.forEach(exam => {
            examMap.set(exam.id, { 
              id: exam.id, 
              title: exam.title, 
              startTime: exam.startTime,
              lessonId: exam.lessonId
            });
            if (exam.lessonId) examLessonIds.push(exam.lessonId);
          });
        }
      }
      
      // 3. Cargar datos de tareas y sus relaciones
      const assignmentMap = new Map<number, Assignment>();
      const assignmentLessonIds: number[] = [];
      if (assignmentIds.length > 0) {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('Assignment')
          .select('id, title, startDate, dueDate, lessonId')
          .in('id', assignmentIds);
        
        if (assignmentsError) {
          throw new Error(`Error al obtener datos de tareas: ${assignmentsError.message}`);
        }
        
        if (assignmentsData) {
          assignmentsData.forEach(assignment => {
            assignmentMap.set(assignment.id, { 
              id: assignment.id, 
              title: assignment.title, 
              startDate: assignment.startDate,
              dueDate: assignment.dueDate,
              lessonId: assignment.lessonId
            });
            if (assignment.lessonId) assignmentLessonIds.push(assignment.lessonId);
          });
        }
      }
      
      // 4. Cargar datos de lecciones y sus relaciones
      const lessonIds = Array.from(new Set([...examLessonIds, ...assignmentLessonIds]));
      const lessonMap = new Map<number, Lesson>();
      const teacherIds: string[] = [];
      const classIds: number[] = [];
      
      if (lessonIds.length > 0) {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('Lesson')
          .select('id, teacherId, classId')
          .in('id', lessonIds);
        
        if (lessonsError) {
          throw new Error(`Error al obtener datos de lecciones: ${lessonsError.message}`);
        }
        
        if (lessonsData) {
          lessonsData.forEach(lesson => {
            lessonMap.set(lesson.id, { 
              id: lesson.id, 
              teacherId: lesson.teacherId,
              classId: lesson.classId
            });
            if (lesson.teacherId) teacherIds.push(lesson.teacherId);
            if (lesson.classId) classIds.push(lesson.classId);
          });
        }
      }
      
      // 5. Cargar datos de profesores
      const teacherMap = new Map<string, Teacher>();
      if (teacherIds.length > 0) {
        const { data: teachersData, error: teachersError } = await supabase
          .from('Teacher')
          .select('id, name, surname')
          .in('id', teacherIds);
        
        if (teachersError) {
          throw new Error(`Error al obtener datos de profesores: ${teachersError.message}`);
        }
        
        if (teachersData) {
          teachersData.forEach(teacher => {
            teacherMap.set(teacher.id, { 
              id: teacher.id, 
              name: teacher.name, 
              surname: teacher.surname 
            });
          });
        }
      }
      
      // 6. Cargar datos de clases
      const classMap = new Map<number, Class>();
      if (classIds.length > 0) {
        const { data: classesData, error: classesError } = await supabase
          .from('Class')
          .select('id, name')
          .in('id', classIds);
        
        if (classesError) {
          throw new Error(`Error al obtener datos de clases: ${classesError.message}`);
        }
        
        if (classesData) {
          classesData.forEach(cls => {
            classMap.set(cls.id, { id: cls.id, name: cls.name });
          });
        }
      }
      
      // 7. Asignar profesores y clases a lecciones
      for (const [lessonId, lesson] of Array.from(lessonMap.entries())) {
        if (lesson.teacherId && teacherMap.has(lesson.teacherId)) {
          lesson.teacher = teacherMap.get(lesson.teacherId);
        }
        if (lesson.classId && classMap.has(lesson.classId)) {
          lesson.class = classMap.get(lesson.classId);
        }
      }
      
      // 8. Asignar lecciones a exámenes y tareas
      for (const [examId, exam] of Array.from(examMap.entries())) {
        if (exam.lessonId && lessonMap.has(exam.lessonId)) {
          exam.lesson = lessonMap.get(exam.lessonId);
        }
      }
      
      for (const [assignmentId, assignment] of Array.from(assignmentMap.entries())) {
        if (assignment.lessonId && lessonMap.has(assignment.lessonId)) {
          assignment.lesson = lessonMap.get(assignment.lessonId);
        }
      }
      
      // 9. Filtrado adicional para el rol de profesor
      let filteredResults = [...resultsData];
      
      if (userRole === "teacher" && userId) {
        filteredResults = filteredResults.filter(result => {
          if (result.examId && examMap.has(result.examId)) {
            const exam = examMap.get(result.examId);
            return exam?.lesson?.teacher?.id === userId;
          }
          if (result.assignmentId && assignmentMap.has(result.assignmentId)) {
            const assignment = assignmentMap.get(result.assignmentId);
            return assignment?.lesson?.teacher?.id === userId;
          }
          return false;
        });
      }
      
      // 10. Filtrado adicional para el rol de estudiante
      else if (userRole === "student" && userId) {
        filteredResults = filteredResults.filter(result => 
          result.studentId === userId
        );
      }
      
      // 11. Filtrado adicional para el rol de padre
      else if (userRole === "parent" && userId) {
        // Obtener los estudiantes asignados al padre
        const { data: parentStudents, error: parentStudentsError } = await supabase
          .from('Student')
          .select('id')
          .eq('parentId', userId);
        
        if (parentStudentsError) {
          throw new Error(`Error al obtener estudiantes del padre: ${parentStudentsError.message}`);
        }
        
        if (parentStudents && parentStudents.length > 0) {
          const childIds = parentStudents.map(student => student.id);
          filteredResults = filteredResults.filter(result => 
            childIds.includes(result.studentId)
          );
        } else {
          // Si no hay estudiantes asignados, no mostrar resultados
          filteredResults = [];
        }
      }
      
      // 12. Filtrado por texto de búsqueda
      if (search && search.length > 0) {
        const searchLower = search.toLowerCase();
        filteredResults = filteredResults.filter(result => {
          // Buscar en título de examen/tarea
          if (result.examId && examMap.has(result.examId)) {
            const exam = examMap.get(result.examId);
            if (exam?.title && exam.title.toLowerCase().includes(searchLower)) return true;
          }
          if (result.assignmentId && assignmentMap.has(result.assignmentId)) {
            const assignment = assignmentMap.get(result.assignmentId);
            if (assignment?.title && assignment.title.toLowerCase().includes(searchLower)) return true;
          }
          
          // Buscar en nombre de estudiante
          if (studentMap.has(result.studentId)) {
            const student = studentMap.get(result.studentId);
            if (
              student?.name.toLowerCase().includes(searchLower) ||
              student?.surname.toLowerCase().includes(searchLower)
            ) {
              return true;
            }
          }
          
          return false;
        });
      }
      
      // 13. Obtener la cantidad total de resultados filtrados
      const totalCount = filteredResults.length;
      
      // 14. Aplicar paginación
      const paginatedResults = filteredResults.slice(
        (page - 1) * ITEM_PER_PAGE, 
        page * ITEM_PER_PAGE
      );
      
      // 15. Crear objetos para mostrar
      const displayResults = paginatedResults.map(result => {
        let assessment;
        let isExam = false;
        
        if (result.examId && examMap.has(result.examId)) {
          assessment = examMap.get(result.examId);
          isExam = true;
        } else if (result.assignmentId && assignmentMap.has(result.assignmentId)) {
          assessment = assignmentMap.get(result.assignmentId);
        } else {
          // Si no tiene ni examen ni tarea, este resultado es inválido
          return null;
        }
        
        const student = studentMap.get(result.studentId) || { name: 'Desconocido', surname: '' };
        const lesson = assessment?.lesson || { teacher: undefined, class: undefined } as Partial<Lesson>;
        const teacher = lesson.teacher || { name: 'Desconocido', surname: '' };
        const className = lesson.class ? lesson.class.name : 'Desconocida';
        
        return {
          id: result.id,
          title: assessment?.title || 'Sin título',
          studentName: student.name,
          studentSurname: student.surname,
          teacherName: teacher.name,
          teacherSurname: teacher.surname,
          score: result.score,
          className,
          startTime: isExam 
            ? (assessment as Exam)?.startTime 
            : (assessment as Assignment)?.startDate,
          isExam
        };
      }).filter(Boolean) as ResultDisplay[];

      return { 
        data: displayResults, 
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
 * Función para crear un nuevo resultado
 */
export function useCreateResult() {
  return useSupabaseMutation<CreateResultParams, { id: number }>(
    async (supabase, params) => {
      // Verificar que se proporciona examId o assignmentId, pero no ambos
      if ((!params.examId && !params.assignmentId) || (params.examId && params.assignmentId)) {
        throw new Error('Debe proporcionar o un examen o una tarea, pero no ambos');
      }
      
      const { data, error } = await supabase
        .from('Result')
        .insert({
          score: params.score,
          studentId: params.studentId,
          examId: params.examId || null,
          assignmentId: params.assignmentId || null
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear resultado: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['result', 'list']],
      onSuccess: () => {
        console.log('Resultado creado exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar un resultado existente
 */
export function useUpdateResult() {
  return useSupabaseMutation<UpdateResultParams, { id: number }>(
    async (supabase, params) => {
      const { id, score } = params;
      
      const { data, error } = await supabase
        .from('Result')
        .update({ score })
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar resultado: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['result', 'list']],
      onSuccess: () => {
        console.log('Resultado actualizado exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar un resultado
 */
export function useDeleteResult() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      const { error } = await supabase
        .from('Result')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar resultado: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['result', 'list']],
      onSuccess: () => {
        console.log('Resultado eliminado exitosamente');
      }
    }
  );
} 