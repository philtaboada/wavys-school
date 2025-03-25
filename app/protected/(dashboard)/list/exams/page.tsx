import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

type Exam = {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  lessonId: number;
  lesson?: {
    id: number;
    name: string;
    subjectId?: number;
    classId?: number;
    teacherId?: string;
    subject?: {
      id: number;
      name: string;
    };
    class?: {
      id: number;
      name: string;
    };
    teacher?: {
      id: string;
      name: string;
      surname: string;
    };
  } | null;
};

export default async function ExamListPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    search?: string;
    classId?: string;
    teacherId?: string;
    [key: string]: string | undefined;
  }>;
}) {
  // Acceder a searchParams de forma asíncrona como recomienda Next.js 15
  const params = await searchParams;
  
  // Extrae los valores de forma segura
  const pageNum = params.page ? parseInt(params.page, 10) : 1;
  const searchText = params.search || '';
  const classIdFilter = params.classId ? parseInt(params.classId) : undefined;
  const teacherIdFilter = params.teacherId;
  
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
      header: "Asignatura",
      accessor: "subject",
    },
    {
      header: "Clase",
      accessor: "class",
    },
    {
      header: "Profesor",
      accessor: "teacher",
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
  const renderRow = (item: Exam) => {
    console.log('DEBUG - Renderizando fila examen:', item);
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.title}</td>
        <td>{item.lesson?.subject?.name || 'N/A'}</td>
        <td>{item.lesson?.class?.name || 'N/A'}</td>
        <td className="hidden md:table-cell">
          {item.lesson?.teacher ? 
            `${item.lesson.teacher.name} ${item.lesson.teacher.surname}` : 
            'N/A'}
        </td>
        <td className="hidden md:table-cell">
          {item.startTime ? new Date(item.startTime).toLocaleDateString() : 'N/A'}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(role === "admin" || (role === "teacher" && item.lesson?.teacher?.id === userId)) && (
              <>
                <FormContainer table="exam" type="update" data={item} />
                <FormContainer table="exam" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Construir la consulta base para la tabla Exam
  let query = supabase
    .from('Exam')
    .select(`
      id,
      title,
      startTime,
      endTime,
      lessonId,
      Lesson:lessonId (
        id,
        name,
        subjectId,
        classId,
        teacherId
      )
    `, { count: 'exact' });

  // Log para depuración - Consulta inicial
  console.log('DEBUG - Consulta inicial creada');

  // Aplicar filtros específicos
  if (classIdFilter) {
    // Obtenemos exámenes donde la lección pertenece a una clase específica
    const { data: lessonIds, error: lessonError } = await supabase
      .from('Lesson')
      .select('id')
      .eq('classId', classIdFilter);
    
    if (!lessonError && lessonIds && lessonIds.length > 0) {
      const ids = lessonIds.map(l => l.id);
      query = query.in('lessonId', ids);
    }
    console.log('DEBUG - Filtro por clase aplicado:', { classIdFilter });
  }

  if (teacherIdFilter) {
    // Obtenemos exámenes donde la lección está asignada a un profesor específico
    const { data: lessonIds, error: lessonError } = await supabase
      .from('Lesson')
      .select('id')
      .eq('teacherId', teacherIdFilter);
    
    if (!lessonError && lessonIds && lessonIds.length > 0) {
      const ids = lessonIds.map(l => l.id);
      query = query.in('lessonId', ids);
    }
    console.log('DEBUG - Filtro por profesor aplicado:', { teacherIdFilter });
  }

  // Aplicar filtros según el rol
  if (role === "teacher") {
    // Obtenemos exámenes donde el profesor es el usuario actual
    const { data: lessonIds, error: lessonError } = await supabase
      .from('Lesson')
      .select('id')
      .eq('teacherId', userId);
    
    if (!lessonError && lessonIds && lessonIds.length > 0) {
      const ids = lessonIds.map(l => l.id);
      query = query.in('lessonId', ids);
    } else {
      // Si no hay lecciones, no mostramos exámenes
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <h1 className="text-lg font-semibold mb-4">Exámenes</h1>
          <p>No tienes lecciones asignadas para ver exámenes.</p>
        </div>
      );
    }
    console.log('DEBUG - Filtro para profesor aplicado:', { userId });
  } else if (role === "student") {
    // Obtenemos la clase del estudiante
    const { data: studentData, error: studentError } = await supabase
      .from('Student')
      .select('classId')
      .eq('id', userId)
      .single();
    
    console.log('DEBUG - Datos del estudiante:', { studentData, studentError });
    
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
        // Si no hay lecciones, no mostramos exámenes
        return (
          <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            <h1 className="text-lg font-semibold mb-4">Exámenes</h1>
            <p>No hay lecciones para tu clase.</p>
          </div>
        );
      }
    } else {
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <h1 className="text-lg font-semibold mb-4">Exámenes</h1>
          <p>No tienes una clase asignada.</p>
        </div>
      );
    }
  } else if (role === "parent") {
    // Obtenemos los estudiantes asignados al padre
    const { data: parentStudents, error: parentError } = await supabase
      .from('Student')
      .select('id, classId')
      .eq('parentId', userId);
    
    console.log('DEBUG - Estudiantes del padre:', parentStudents);
    
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
        // Si no hay lecciones, no mostramos exámenes
        return (
          <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            <h1 className="text-lg font-semibold mb-4">Exámenes</h1>
            <p>No hay lecciones para las clases de tus estudiantes.</p>
          </div>
        );
      }
    } else {
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <h1 className="text-lg font-semibold mb-4">Exámenes</h1>
          <p>No tienes estudiantes asignados para ver sus exámenes.</p>
        </div>
      );
    }
  }

  // Aplicar filtros de búsqueda
  if (searchText) {
    console.log('DEBUG - Aplicando búsqueda:', { searchText });
    
    // Buscar por título de examen
    query = query.ilike('title', `%${searchText}%`);
  }

  // Paginación
  query = query
    .range((pageNum - 1) * ITEM_PER_PAGE, pageNum * ITEM_PER_PAGE - 1)
    .order('id', { ascending: false });

  // Log para depuración - Consulta final
  console.log('DEBUG - Consulta final antes de ejecutar');
  
  const { data: examData, error, count } = await query;

  // Log para depuración - Resultados de la consulta
  console.log('DEBUG - Resultados:', { 
    dataLength: examData?.length, 
    count, 
    error: error ? JSON.stringify(error) : null,
    primerRegistro: examData && examData.length > 0 ? JSON.stringify(examData[0]) : null
  });

  // Formatear los datos para la vista
  let data: Exam[] = [];
  
  if (examData && examData.length > 0) {
    // Convertir los datos de Supabase al formato que espera nuestro componente
    data = examData.map(exam => ({
      id: exam.id,
      title: exam.title,
      startTime: exam.startTime,
      endTime: exam.endTime,
      lessonId: exam.lessonId,
      lesson: null // Inicialmente vacío, se llenará más adelante
    }));
    
    // 1. Obtener todos los IDs de lecciones únicos
    const lessonIds = examData
      .filter(exam => exam.lessonId)
      .map(exam => exam.lessonId)
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
        
        // 4. Asignar lecciones completas a los exámenes
        for (let i = 0; i < data.length; i++) {
          const exam = data[i];
          if (exam.lessonId && lessonMap.has(exam.lessonId)) {
            data[i] = {
              ...exam,
              lesson: lessonMap.get(exam.lessonId)
            };
          }
        }
      }
    }
  }

  if (error) {
    console.error('Error al obtener datos de exámenes:', error);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Exámenes</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {JSON.stringify(error, null, 2)}
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
          Todos los exámenes
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
              <FormContainer table="exam" type="create" />
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
            <p>Registros: {count ?? 0}</p>
            {error && (
              <div className="mt-2 text-red-600">
                <p>Error: {JSON.stringify(error)}</p>
                <pre>{JSON.stringify(error, null, 2)}</pre>
              </div>
            )}
          </details>
        </div>
      )}
      
      {/* LIST */}
      {data && data.length > 0 ? (
        <Table columns={columns} renderRow={renderRow} data={data} />
      ) : (
        <div className="py-4 text-center">
          <p>No se encontraron exámenes.</p>
        </div>
      )}
      
      {/* PAGINATION */}
      <Pagination page={pageNum} count={count ?? 0} />
    </div>
  );
}

  