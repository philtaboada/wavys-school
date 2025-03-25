import FormContainer from "@/components/FormContainer";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

type Attendance = {
  id: number;
  date: Date;
  present: boolean;
  student_id?: string;
  lesson_id?: number;
  studentId?: string;
  lessonId?: number;
  Student?: {
    id: string;
    name: string;
    surname: string;
  };
  Lesson?: {
    id: number;
    name: string;
    Subject?: {
      id: number;
      name: string;
    };
  };
};

export default async function AttendanceListPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    search?: string;
    [key: string]: string | undefined;
  }>;
}) {
  // Acceder a searchParams de forma asíncrona como recomienda Next.js 15
  const params = await searchParams;
  
  // Extrae los valores de forma segura
  const pageNum = params.page ? parseInt(params.page, 10) : 1;
  const searchText = params.search || '';
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata as { role?: string })?.role;
  const userId = user?.id;

  const columns = [
    {
      header: "Estudiante",
      accessor: "student",
    },
    {
      header: "Lección",
      accessor: "lesson",
    },
    {
      header: "Fecha",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    {
      header: "Estado",
      accessor: "status",
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

  const renderRow = (item: Attendance) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">
          {item.Student?.name} {item.Student?.surname}
        </td>
        <td>
          {item.Lesson?.Subject?.name}: {item.Lesson?.name}
        </td>
        <td className="hidden md:table-cell">
          {new Date(item.date).toLocaleDateString()}
        </td>
        <td className="hidden md:table-cell">
          <span className={`p-2 rounded-md ${item.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {item.present ? 'Presente' : 'Ausente'}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "teacher") && (
              <>
                <FormContainer table="attendance" type="update" data={item} />
                <FormContainer table="attendance" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Construir la consulta base
  let query = supabase
    .from('Attendance')
    .select(`
      *,
      Student(*),
      Lesson(*, Subject(*))
    `, { count: 'exact' });

  // Aplicar filtros según el rol
  if (role === "teacher") {
    // Obtener lecciones impartidas por el profesor
    const { data: teacherLessons, error: lessonError } = await supabase
      .from('Lesson')
      .select('id')
      .eq('teacherId', userId);
    
    
    if (teacherLessons && teacherLessons.length > 0) {
      const lessonIds = teacherLessons.map(lesson => lesson.id);
      query = query.in('lesson_id', lessonIds);
    } else {
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <div className="flex items-center justify-between">
            <h1 className="hidden md:block text-lg font-semibold">Registro de Asistencia</h1>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-4 self-end">
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                  <Image src="/filter.png" alt="" width={14} height={14} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                  <Image src="/sort.png" alt="" width={14} height={14} />
                </button>
              </div>
            </div>
          </div>
          <p className="my-4">No tienes lecciones asignadas para gestionar asistencia.</p>
        </div>
      );
    }
  } else if (role === "student") {
    query = query.eq('student_id', userId);
    console.log('DEBUG - Filtro para estudiante aplicado:', { userId });
  } else if (role === "parent") {
    // Obtener estudiantes del padre
    const { data: parentStudents, error: studentError } = await supabase
      .from('Student')
      .select('id')
      .eq('parentId', userId);
    
    if (parentStudents && parentStudents.length > 0) {
      const studentIds = parentStudents.map(student => student.id);
      query = query.in('student_id', studentIds);
    } else {
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <h1 className="text-lg font-semibold mb-4">Registro de Asistencia</h1>
          <p>No tienes estudiantes asignados para ver su asistencia.</p>
        </div>
      );
    }
  }

  // Aplicar filtros de búsqueda
  if (searchText) {

    // Adaptar esto según tu lógica específica de búsqueda
    const { data: searchStudents, error: searchError } = await supabase
      .from('Student')
      .select('id')
      .ilike('name', `%${searchText}%`)
      .or(`surname.ilike.%${searchText}%`);
    
    if (searchStudents && searchStudents.length > 0) {
      const studentIds = searchStudents.map(student => student.id);
      query = query.in('student_id', studentIds);
    }
  }

  // Paginación
  query = query
    .range((pageNum - 1) * ITEM_PER_PAGE, pageNum * ITEM_PER_PAGE - 1)
    .order('id', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error al obtener datos de asistencia:', error);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Registro de Asistencia</h1>
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
          Registro de Asistencia
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
              <FormContainer table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>
    
      
      {/* LIST */}
      {data && data.length > 0 ? (
        <Table columns={columns} renderRow={renderRow} data={data} />
      ) : (
        <div className="py-4 text-center">
          <p>No se encontraron registros de asistencia.</p>
        </div>
      )}
      
      {/* PAGINATION */}
      <Pagination page={pageNum} count={count ?? 0} />
    </div>
  );
}
