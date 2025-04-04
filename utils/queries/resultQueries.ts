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

// Tipo de datos principal (ajustado para recibir datos anidados)
export type Result = {
  id: number;
  score: number;
  studentId: string;
  examId?: number | null;
  assignmentId?: number | null;
  Student?: { // Cambiado de 'student?' a 'Student?' para coincidir con el select
    id: string;
    name: string;
    surname: string;
    parentId?: string | null; // Añadido para filtro de padre
  } | null;
  Exam?: { // Cambiado de 'exam?' a 'Exam?'
    id: number;
    title: string;
    startTime: string; // Supabase devuelve como string
    lessonId: number;
    Lesson?: { // Anidado
      id: number;
      teacherId?: string | null;
      classId?: number | null;
      Teacher?: { // Anidado
        id: string;
        name: string;
        surname: string;
      } | null;
      Class?: { // Anidado
        id: number;
        name: string;
      } | null;
    } | null;
  } | null;
  Assignment?: { // Cambiado de 'assignment?' a 'Assignment?'
    id: number;
    title: string;
    startDate: string; // Supabase devuelve como string
    dueDate: string; // Supabase devuelve como string
    lessonId: number;
    Lesson?: { // Anidado (igual que en Exam)
      id: number;
      teacherId?: string | null;
      classId?: number | null;
      Teacher?: {
        id: string;
        name: string;
        surname: string;
      } | null;
      Class?: {
        id: number;
        name: string;
      } | null;
    } | null;
  } | null;
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
 * Hook para obtener la lista de resultados con filtrado y paginación optimizada
 */
export function useResultList(params: ResultListParams & { userRole?: string; userId?: string }) {
  const { page, search, studentId, examId, assignmentId, userRole, userId } = params;

  return useSupabaseQuery<ResultListResult>(
    // La queryKey sigue igual para mantener la estructura de caché
    ['result', 'list', page, search, studentId, examId, assignmentId, userRole, userId],
    async (supabase) => {
      // Construir la consulta base con joins implícitos
      let query = supabase
        .from('Result')
        .select(`
          id,
          score,
          studentId,
          examId,
          assignmentId,
          Student (id, name, surname, parentId),
          Exam (
            id, title, startTime,
            Lesson (
              id, teacherId, classId,
              Teacher (id, name, surname),
              Class (id, name)
            )
          ),
          Assignment (
            id, title, startDate, dueDate,
            Lesson (
              id, teacherId, classId,
              Teacher (id, name, surname),
              Class (id, name)
            )
          )
        `, { count: 'exact' }); // Mantenemos count: 'exact' para la paginación

      // Aplicar filtros específicos directos en la consulta
      if (studentId) {
        query = query.eq('studentId', studentId);
      }
      if (examId) {
        query = query.eq('examId', examId);
      }
      if (assignmentId) {
        query = query.eq('assignmentId', assignmentId);
      }

      // **Filtros complejos (rol, búsqueda) se aplican DESPUÉS de obtener los datos**
      // Podrían optimizarse más moviéndolos a funciones de base de datos (RPC) si el rendimiento sigue siendo un problema.

      // Paginación (se aplica antes de la ejecución)
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd);

      // Ejecutar la consulta única
      const { data: resultsData, error: resultsError, count } = await query.returns<Result[]>(); // Especificar tipo de retorno

      if (resultsError) {
        console.error("Error fetching results:", resultsError);
        throw new Error(`Error al obtener datos de resultados: ${resultsError.message}`);
      }

      // Si no hay resultados, retornar temprano
      if (!resultsData || resultsData.length === 0) {
        return { data: [], count: count || 0 };
      }

      // **Procesamiento y filtrado adicional en el cliente (Post-fetch Filtering)**
      // Esto es necesario para filtros complejos que no se pueden traducir fácilmente a la API de Supabase
      // o que dependen de datos relacionados de forma compleja (como el rol).

      let filteredResults = [...resultsData];

      // 1. Filtrado por rol (Teacher)
      if (userRole === "teacher" && userId) {
        filteredResults = filteredResults.filter(result => {
          const lesson = result.Exam?.Lesson || result.Assignment?.Lesson;
          return lesson?.teacherId === userId;
        });
      }
      // 2. Filtrado por rol (Student) - Este ya se aplica en la query si studentId está presente
      else if (userRole === "student" && userId && !studentId) { // Aplicar solo si no se filtró por ID específico
        filteredResults = filteredResults.filter(result => result.studentId === userId);
      }
      // 3. Filtrado por rol (Parent)
      else if (userRole === "parent" && userId) {
        // Nota: El filtro original hacía otra llamada a Supabase. Lo mantenemos en cliente por ahora.
        // Para optimizarlo más, se necesitaría una función RPC o filtrar previamente los students.
         filteredResults = filteredResults.filter(result =>
           result.Student?.parentId === userId
         );
        // Alternativa (si no se incluye parentId en Student select): Necesitaría otra llamada o pre-fetch
        // const { data: parentStudents } = await supabase.from('Student').select('id').eq('parentId', userId);
        // const childIds = parentStudents?.map(s => s.id) || [];
        // filteredResults = filteredResults.filter(result => childIds.includes(result.studentId));
      }

      // 4. Filtrado por texto de búsqueda
      if (search && search.length > 0) {
        const searchLower = search.toLowerCase();
        filteredResults = filteredResults.filter(result => {
          const student = result.Student;
          const exam = result.Exam;
          const assignment = result.Assignment;

          // Buscar en título de examen/tarea
          if (exam?.title && exam.title.toLowerCase().includes(searchLower)) return true;
          if (assignment?.title && assignment.title.toLowerCase().includes(searchLower)) return true;

          // Buscar en nombre de estudiante
          if (
            student?.name.toLowerCase().includes(searchLower) ||
            student?.surname.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
          return false;
        });
      }

      // Mapear a ResultDisplay después de todos los filtros
      const displayResults: ResultDisplay[] = filteredResults.map(result => {
        const student = result.Student;
        const exam = result.Exam;
        const assignment = result.Assignment;
        const lesson = exam?.Lesson || assignment?.Lesson;
        const teacher = lesson?.Teacher;
        const cls = lesson?.Class;
        const isExam = !!exam;

        return {
          id: result.id,
          title: exam?.title || assignment?.title || 'Sin título',
          studentName: student?.name || 'Desconocido',
          studentSurname: student?.surname || '',
          teacherName: teacher?.name || 'Desconocido',
          teacherSurname: teacher?.surname || '',
          score: result.score,
          className: cls?.name || 'Desconocida',
          // Parsear fechas después de recibirlas
          startTime: new Date(exam?.startTime || assignment?.startDate || 0),
          isExam
        };
      });

      // Devolver datos mapeados y el contador total (del query inicial antes del filtro en cliente)
      // Nota: El 'count' refleja el total ANTES del filtrado por rol/búsqueda en cliente.
      // Para un contador exacto post-filtro, se necesitaría lógica adicional o mover filtros al backend.
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
        .select('id') // Solo seleccionar el id es suficiente
        .single();

      if (error) {
        console.error("Error creating result:", error);
        throw new Error(`Error al crear resultado: ${error.message}`);
      }

      return data as { id: number };
    },
    {
      invalidateQueries: [['result', 'list']], // Mantenemos la invalidación
      onSuccess: () => {
        // console.log('Resultado creado exitosamente'); // Podemos quitar logs si no son necesarios
      },
      onError: (error) => {
         console.error("Mutation error (Create Result):", error);
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
        .select('id') // Solo seleccionar el id
        .single();

      if (error) {
        console.error("Error updating result:", error);
        throw new Error(`Error al actualizar resultado: ${error.message}`);
      }

      return data as { id: number };
    },
    {
      invalidateQueries: [['result', 'list']],
      onSuccess: () => {
        // console.log('Resultado actualizado exitosamente');
      },
       onError: (error) => {
         console.error("Mutation error (Update Result):", error);
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
        .eq('id', id); // No necesitamos select aquí

      if (error) {
        console.error("Error deleting result:", error);
        throw new Error(`Error al eliminar resultado: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['result', 'list']],
      onSuccess: () => {
        // console.log('Resultado eliminado exitosamente');
      },
       onError: (error) => {
         console.error("Mutation error (Delete Result):", error);
      }
    }
  );
} 