import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

type Result = {
  id: number;
  score: number;
  studentId: string;
  examId?: number | null;
  assignmentId?: number | null;
  student?: {
    id: string;
    name: string;
    surname: string;
  };
  exam?: {
    id: number;
    title: string;
    startTime: Date;
    lessonId: number;
    lesson?: {
      id: number;
      teacherId?: string;
      classId?: number;
      teacher?: {
        id: string;
        name: string;
        surname: string;
      };
      class?: {
        id: number;
        name: string;
      };
    };
  };
  assignment?: {
    id: number;
    title: string;
    startDate: Date;
    dueDate: Date;
    lessonId: number;
    lesson?: {
      id: number;
      teacherId?: string;
      classId?: number;
      teacher?: {
        id: string;
        name: string;
        surname: string;
      };
      class?: {
        id: number;
        name: string;
      };
    };
  };
};

type ResultDisplay = {
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

export default async function ResultListPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    search?: string;
    studentId?: string;
    [key: string]: string | undefined;
  }>;
}) {
  // Acceder a searchParams de forma asíncrona como recomienda Next.js 15
  const params = await searchParams;
  
  // Extrae los valores de forma segura
  const pageNum = params.page ? parseInt(params.page, 10) : 1;
  const searchText = params.search || '';
  const studentIdFilter = params.studentId;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata as { role?: string })?.role || '';
  const userId = user?.id || '';

  // Log para depuración - Información del usuario
  console.log('DEBUG - Usuario:', { userId, role });

  const columns = [
    {
      header: "Título",
      accessor: "title",
    },
    {
      header: "Estudiante",
      accessor: "student",
    },
    {
      header: "Calificación",
      accessor: "score",
      className: "hidden md:table-cell",
    },
    {
      header: "Profesor",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Clase",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Fecha",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Acciones",
            accessor: "action",
          },
        ]
      : []),
  ];

  // Función para renderizar cada fila
  const renderRow = (item: ResultDisplay) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.title}</td>
        <td>{`${item.studentName} ${item.studentSurname}`}</td>
        <td className="hidden md:table-cell">{item.score}</td>
        <td className="hidden md:table-cell">
          {`${item.teacherName} ${item.teacherSurname}`}
        </td>
        <td className="hidden md:table-cell">{item.className}</td>
        <td className="hidden md:table-cell">
          {item.startTime ? new Date(item.startTime).toLocaleDateString() : 'N/A'}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "teacher") && (
              <>
                <FormContainer table="result" type="update" data={item} />
                <FormContainer table="result" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Construir la consulta base para los resultados
  // Dado que los resultados pueden estar asociados a exámenes o tareas,
  // haremos dos consultas separadas y luego combinaremos los resultados

  // Función para construir la consulta dependiendo del rol
  const buildResultsQuery = (query: any) => {
    // Aplicar filtros específicos
    if (studentIdFilter) {
      query = query.eq('studentId', studentIdFilter);
      console.log('DEBUG - Filtro por estudiante aplicado:', { studentIdFilter });
    }

    // Aplicar filtros según el rol
    if (role === "teacher") {
      // Para profesores, filtraremos más adelante, ya que necesitamos relacionar con lecciones
      console.log('DEBUG - Rol profesor, filtrado especial');
    } else if (role === "student") {
      // Estudiante solo ve sus propios resultados
      query = query.eq('studentId', userId);
      console.log('DEBUG - Filtro para estudiante aplicado:', { userId });
    } else if (role === "parent") {
      // Padre ve resultados de sus hijos
      // Obtendremos los IDs de estudiantes más adelante
      console.log('DEBUG - Rol padre, filtrado especial');
    }

    // Aplicar filtros de búsqueda (básicos, los más específicos se hacen más tarde)
    if (searchText) {
      console.log('DEBUG - Aplicando búsqueda:', { searchText });
      // La búsqueda por título o nombre se hace después de cargar los datos relacionados
    }

    return query;
  };

  // Consulta principal para resultados
  let resultQuery = supabase.from('Result').select('*', { count: 'exact' });
  resultQuery = buildResultsQuery(resultQuery);

  // Paginación (aplicamos al final cuando tengamos todos los resultados filtrados)
  // Lo manejaremos manualmente después de combinar exámenes y tareas

  // Log para depuración - Consulta inicial
  console.log('DEBUG - Consulta inicial creada');

  // Ejecutar la consulta
  const { data: resultsData, error: resultsError, count } = await resultQuery;

  // Log para depuración - Resultados de la consulta
  console.log('DEBUG - Resultados:', { 
    dataLength: resultsData?.length, 
    count, 
    error: resultsError ? JSON.stringify(resultsError) : null,
    primerRegistro: resultsData && resultsData.length > 0 ? JSON.stringify(resultsData[0]) : null
  });

  // Procesamiento para mostrar resultados
  let displayResults: ResultDisplay[] = [];

  if (resultsData && resultsData.length > 0) {
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
    const studentMap = new Map();
    if (studentIds.length > 0) {
      const { data: studentsData } = await supabase
        .from('Student')
        .select('id, name, surname')
        .in('id', studentIds);
      
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
    const examMap = new Map();
    const examLessonIds: number[] = [];
    if (examIds.length > 0) {
      const { data: examsData } = await supabase
        .from('Exam')
        .select('id, title, startTime, lessonId')
        .in('id', examIds);
      
      if (examsData) {
        examsData.forEach(exam => {
          examMap.set(exam.id, { 
            id: exam.id, 
            title: exam.title, 
            startTime: exam.startTime,
            lessonId: exam.lessonId,
            lesson: null // Lo llenamos después
          });
          if (exam.lessonId) examLessonIds.push(exam.lessonId);
        });
      }
    }
    
    // 3. Cargar datos de tareas y sus relaciones
    const assignmentMap = new Map();
    const assignmentLessonIds: number[] = [];
    if (assignmentIds.length > 0) {
      const { data: assignmentsData } = await supabase
        .from('Assignment')
        .select('id, title, startDate, dueDate, lessonId')
        .in('id', assignmentIds);
      
      if (assignmentsData) {
        assignmentsData.forEach(assignment => {
          assignmentMap.set(assignment.id, { 
            id: assignment.id, 
            title: assignment.title, 
            startDate: assignment.startDate,
            dueDate: assignment.dueDate,
            lessonId: assignment.lessonId,
            lesson: null // Lo llenamos después
          });
          if (assignment.lessonId) assignmentLessonIds.push(assignment.lessonId);
        });
      }
    }
    
    // 4. Cargar datos de lecciones y sus relaciones
      const lessonIds = Array.from(new Set([...examLessonIds, ...assignmentLessonIds]));
    const lessonMap = new Map();
    const teacherIds: string[] = [];
    const classIds: number[] = [];
    
    if (lessonIds.length > 0) {
      const { data: lessonsData } = await supabase
        .from('Lesson')
        .select('id, teacherId, classId')
        .in('id', lessonIds);
      
      if (lessonsData) {
        lessonsData.forEach(lesson => {
          lessonMap.set(lesson.id, { 
            id: lesson.id, 
            teacherId: lesson.teacherId,
            classId: lesson.classId,
            teacher: null, // Lo llenamos después
            class: null // Lo llenamos después
          });
          if (lesson.teacherId) teacherIds.push(lesson.teacherId);
          if (lesson.classId) classIds.push(lesson.classId);
        });
      }
    }
    
    // 5. Cargar datos de profesores
    const teacherMap = new Map();
    if (teacherIds.length > 0) {
      const { data: teachersData } = await supabase
        .from('Teacher')
        .select('id, name, surname')
        .in('id', teacherIds);
      
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
    const classMap = new Map();
    if (classIds.length > 0) {
      const { data: classesData } = await supabase
        .from('Class')
        .select('id, name')
        .in('id', classIds);
      
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
    
    if (role === "teacher") {
      filteredResults = filteredResults.filter(result => {
        if (result.examId && examMap.has(result.examId)) {
          const exam = examMap.get(result.examId);
          return exam.lesson?.teacher?.id === userId;
        }
        if (result.assignmentId && assignmentMap.has(result.assignmentId)) {
          const assignment = assignmentMap.get(result.assignmentId);
          return assignment.lesson?.teacher?.id === userId;
        }
        return false;
      });
    }
    
    // 10. Filtrado adicional para el rol de padre
    if (role === "parent") {
      // Obtener los estudiantes asignados al padre
      const { data: parentStudents } = await supabase
        .from('Student')
        .select('id')
        .eq('parentId', userId);
      
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
    
    // 11. Filtrado por texto de búsqueda
    if (searchText && searchText.length > 0) {
      const searchLower = searchText.toLowerCase();
      filteredResults = filteredResults.filter(result => {
        // Buscar en título de examen/tarea
        if (result.examId && examMap.has(result.examId)) {
          const exam = examMap.get(result.examId);
          if (exam.title.toLowerCase().includes(searchLower)) return true;
        }
        if (result.assignmentId && assignmentMap.has(result.assignmentId)) {
          const assignment = assignmentMap.get(result.assignmentId);
          if (assignment.title.toLowerCase().includes(searchLower)) return true;
        }
        
        // Buscar en nombre de estudiante
        if (studentMap.has(result.studentId)) {
          const student = studentMap.get(result.studentId);
          if (
            student.name.toLowerCase().includes(searchLower) ||
            student.surname.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    // 12. Paginación manual
    const totalCount = filteredResults.length;
    const paginatedResults = filteredResults.slice(
      (pageNum - 1) * ITEM_PER_PAGE, 
      pageNum * ITEM_PER_PAGE
    );
    
    // 13. Crear objetos para mostrar
    displayResults = paginatedResults.map(result => {
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
      const lesson = assessment.lesson || {};
      const teacher = lesson.teacher || { name: 'Desconocido', surname: '' };
      const className = lesson.class ? lesson.class.name : 'Desconocida';
      
      return {
        id: result.id,
        title: assessment.title || 'Sin título',
        studentName: student.name,
        studentSurname: student.surname,
        teacherName: teacher.name,
        teacherSurname: teacher.surname,
        score: result.score,
        className,
        startTime: isExam ? assessment.startTime : assessment.startDate,
        isExam
      };
    }).filter(Boolean) as ResultDisplay[];
  }

  if (resultsError) {
    console.error('Error al obtener datos de resultados:', resultsError);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Resultados</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {JSON.stringify(resultsError, null, 2)}
        </pre>
      </div>
    );
  }

  // Componente final
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos los resultados
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="result" type="create" />
            )}
          </div>
        </div>
      </div>
      
      {/* Estado de depuración */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-blue-50 p-2 mb-4 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Información de depuración</summary>
            <p>Usuario: {userId} (Rol: {role})</p>
            <p>Página: {pageNum}, Búsqueda: "{searchText}"</p>
            <p>Registros: {displayResults.length} (mostrados) / {count || 0} (total)</p>
            {resultsError && (
              <div className="mt-2 text-red-600">
                <p>Error: {JSON.stringify(resultsError)}</p>
                <pre>{JSON.stringify(resultsError, null, 2)}</pre>
              </div>
            )}
          </details>
        </div>
      )}
      
      {/* LIST */}
      {displayResults && displayResults.length > 0 ? (
        <Table columns={columns} renderRow={renderRow} data={displayResults} />
      ) : (
        <div className="py-4 text-center">
          <p>No se encontraron resultados.</p>
        </div>
      )}
      
      {/* PAGINATION */}
      <Pagination page={pageNum} count={count ?? 0} />
    </div>
  );
}
