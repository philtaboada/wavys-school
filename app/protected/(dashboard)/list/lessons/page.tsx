import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

type Lesson = {
  id: number;
  name: string;
  class_id?: number;
  classId?: number;
  teacher_id?: string;
  teacherId?: string;
  subject_id?: number;
  subjectId?: number;
  Class?: {
    id: number;
    name: string;
  };
  Teacher?: {
    id: string;
    name: string;
    surname: string;
  };
  Subject?: {
    id: number;
    name: string;
  };
};

export default async function LessonListPage({
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
  const role = (user?.user_metadata as { role?: string })?.role;
  const userId = user?.id;

  // Log para depuración - Información del usuario
  console.log('DEBUG - Usuario:', { userId, role });

  const columns = [
    {
      header: "Asignatura",
      accessor: "name",
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
    ...(role === "admin"
      ? [
          {
            header: "Acciones",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: Lesson) => {
    console.log('DEBUG - Renderizando fila lesson:', item);
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.Subject?.name}</td>
        <td>{item.Class?.name}</td>
        <td className="hidden md:table-cell">
          {item.Teacher?.name} {item.Teacher?.surname}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <>
                <FormContainer table="lesson" type="update" data={item} />
                <FormContainer table="lesson" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Construir la consulta base
  let query = supabase
    .from('Lesson')
    .select(`
      *,
      Class(*),
      Teacher(*),
      Subject(*)
    `, { count: 'exact' });

  // Log para depuración - Consulta inicial
  console.log('DEBUG - Consulta inicial creada');

  // Aplicar filtros específicos
  if (classIdFilter) {
    query = query.eq('classId', classIdFilter);
    console.log('DEBUG - Filtro por clase aplicado:', { classIdFilter });
  }

  if (teacherIdFilter) {
    query = query.eq('teacherId', teacherIdFilter);
    console.log('DEBUG - Filtro por profesor aplicado:', { teacherIdFilter });
  }

  // Aplicar filtros según el rol
  if (role === "teacher") {
    query = query.eq('teacherId', userId);
    console.log('DEBUG - Filtro para profesor aplicado:', { userId });
  } else if (role === "student") {
    // Obtener clases del estudiante
    const { data: studentClasses, error: classError } = await supabase
      .from('StudentClass')
      .select('classId')
      .eq('studentId', userId);
    
    console.log('DEBUG - Clases del estudiante:', { studentClasses, classError });
    
    if (studentClasses && studentClasses.length > 0) {
      const classIds = studentClasses.map(sc => sc.classId);
      query = query.in('classId', classIds);
    } else {
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <h1 className="text-lg font-semibold mb-4">Lecciones</h1>
          <p>No estás inscrito en ninguna clase.</p>
        </div>
      );
    }
  } else if (role === "parent") {
    // Obtener estudiantes del padre
    const { data: parentStudents, error: studentError } = await supabase
      .from('Student')
      .select('id')
      .eq('parentId', userId);
    
    console.log('DEBUG - Estudiantes del padre:', { parentStudents, studentError });
    
    if (parentStudents && parentStudents.length > 0) {
      const studentIds = parentStudents.map(student => student.id);
      
      // Obtener clases de los estudiantes
      const { data: studentClasses, error: classError } = await supabase
        .from('StudentClass')
        .select('classId')
        .in('studentId', studentIds);
      
      console.log('DEBUG - Clases de los hijos:', { studentClasses, classError });
      
      if (studentClasses && studentClasses.length > 0) {
        const classIds = studentClasses.map(sc => sc.classId);
        query = query.in('classId', classIds);
      } else {
        return (
          <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            <h1 className="text-lg font-semibold mb-4">Lecciones</h1>
            <p>Tus hijos no están inscritos en ninguna clase.</p>
          </div>
        );
      }
    } else {
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <h1 className="text-lg font-semibold mb-4">Lecciones</h1>
          <p>No tienes estudiantes asignados.</p>
        </div>
      );
    }
  }

  // Aplicar filtros de búsqueda
  if (searchText) {
    // Log para depuración - Búsqueda
    console.log('DEBUG - Aplicando búsqueda:', { searchText });
    
    // Buscar por nombre de asignatura o profesor
    query = query.or(`Subject.name.ilike.%${searchText}%,Teacher.name.ilike.%${searchText}%,Teacher.surname.ilike.%${searchText}%`);
  }

  // Paginación
  query = query
    .range((pageNum - 1) * ITEM_PER_PAGE, pageNum * ITEM_PER_PAGE - 1)
    .order('id', { ascending: false });

  // Log para depuración - Consulta final
  console.log('DEBUG - Consulta final antes de ejecutar');
  
  const { data, error, count } = await query;

  // Log para depuración - Resultados de la consulta
  console.log('DEBUG - Resultados:', { 
    dataLength: data?.length, 
    count, 
    error: error ? JSON.stringify(error) : null,
    primerRegistro: data && data.length > 0 ? JSON.stringify(data[0]) : null
  });

  if (error) {
    console.error('Error al obtener datos de lecciones:', error);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Lecciones</h1>
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
          Todas las lecciones
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
            {role === "admin" && (
              <FormContainer table="lesson" type="create" />
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
          <p>No se encontraron lecciones.</p>
        </div>
      )}
      
      {/* PAGINATION */}
      <Pagination page={pageNum} count={count ?? 0} />
    </div>
  );
}
