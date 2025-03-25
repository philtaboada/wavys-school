import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

type Subject = {
  id: number;
  name: string;
  teachers?: {
    id: string;
    name: string;
    surname: string;
  }[];
};

export default async function SubjectListPage({
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

  // Log para depuración - Información del usuario
  console.log('DEBUG - Usuario:', { userId, role });

  const columns = [
    {
      header: "Asignatura",
      accessor: "name",
    },
    {
      header: "Profesores",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    {
      header: "Acciones",
      accessor: "action",
    },
  ];

  const renderRow = (item: Subject) => {
    console.log('DEBUG - Renderizando fila asignatura:', item);
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.name}</td>
        <td className="hidden md:table-cell">
          {item.teachers && item.teachers.length > 0 
            ? item.teachers.map(teacher => `${teacher.name} ${teacher.surname}`).join(", ")
            : "Sin profesores asignados"}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <>
                <FormContainer table="subject" type="update" data={item} />
                <FormContainer table="subject" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Construir la consulta base
  // Primero obtenemos las asignaturas
  let query = supabase
    .from('Subject')
    .select('*', { count: 'exact' });

  // Log para depuración - Consulta inicial
  console.log('DEBUG - Consulta inicial creada');

  // Aplicar filtros de búsqueda
  if (searchText) {
    query = query.ilike('name', `%${searchText}%`);
    console.log('DEBUG - Aplicando búsqueda:', { searchText });
  }

  // Paginación
  query = query
    .range((pageNum - 1) * ITEM_PER_PAGE, pageNum * ITEM_PER_PAGE - 1)
    .order('id', { ascending: false });

  // Log para depuración - Consulta final
  console.log('DEBUG - Consulta final antes de ejecutar');
  
  const { data, error, count } = await query;

  // Log para depuración - Resultados de la consulta
  console.log('DEBUG - Resultados asignaturas:', { 
    dataLength: data?.length, 
    count, 
    error: error ? JSON.stringify(error) : null
  });

  // Si hay resultados, obtener los profesores asociados a cada asignatura
  let subjectsWithTeachers: Subject[] = [];
  
  if (data && data.length > 0) {
    // Para cada asignatura, obtenemos sus profesores
    for (const subject of data) {
      const { data: teacherSubjects, error: relationError } = await supabase
        .from('TeacherSubject')
        .select('teacherId')
        .eq('subjectId', subject.id);
      
      console.log(`DEBUG - Profesores para asignatura ${subject.id}:`, { 
        teacherSubjects, 
        error: relationError ? JSON.stringify(relationError) : null 
      });
      
      let teachers: {id: string; name: string; surname: string}[] = [];
      
      if (teacherSubjects && teacherSubjects.length > 0) {
        const teacherIds = teacherSubjects.map(ts => ts.teacherId);
        
        const { data: teachersData, error: teachersError } = await supabase
          .from('Teacher')
          .select('id, name, surname')
          .in('id', teacherIds);
        
        console.log(`DEBUG - Datos de profesores para asignatura ${subject.id}:`, { 
          teachersData, 
          error: teachersError ? JSON.stringify(teachersError) : null 
        });
        
        if (teachersData) {
          teachers = teachersData;
        }
      }
      
      subjectsWithTeachers.push({
        ...subject,
        teachers
      });
    }
  }

  if (error) {
    console.error('Error al obtener datos de asignaturas:', error);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Asignaturas</h1>
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
          Todas las asignaturas
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
              <FormContainer table="subject" type="create" />
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
      {subjectsWithTeachers.length > 0 ? (
        <Table columns={columns} renderRow={renderRow} data={subjectsWithTeachers} />
      ) : (
        <div className="py-4 text-center">
          <p>No se encontraron asignaturas.</p>
        </div>
      )}
      
      {/* PAGINATION */}
      <Pagination page={pageNum} count={count ?? 0} />
    </div>
  );
}
