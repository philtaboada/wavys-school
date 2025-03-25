import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

type Class = {
  id: number;
  name: string;
  capacity: number;
  supervisorId?: string;
  supervisor_id?: string;
  Supervisor?: {
    id: string;
    name: string;
    surname: string;
  };
};

export default async function ClassListPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    search?: string;
    supervisorId?: string;
    [key: string]: string | undefined;
  }>;
}) {
  // Acceder a searchParams de forma asíncrona como recomienda Next.js 15
  const params = await searchParams;
  
  // Extrae los valores de forma segura
  const pageNum = params.page ? parseInt(params.page, 10) : 1;
  const searchText = params.search || '';
  const supervisorIdFilter = params.supervisorId;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata as { role?: string })?.role || '';
  const userId = user?.id || '';

  // Log para depuración - Información del usuario
  console.log('DEBUG - Usuario:', { userId, role });

  const columns = [
    {
      header: "Nombre de la clase",
      accessor: "name",
    },
    {
      header: "Capacidad",
      accessor: "capacity",
      className: "hidden md:table-cell",
    },
    {
      header: "Grado",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Supervisor",
      accessor: "supervisor",
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

  const renderRow = (item: Class) => {
    console.log('DEBUG - Renderizando fila clase:', item);
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.name}</td>
        <td className="hidden md:table-cell">{item.capacity}</td>
        <td className="hidden md:table-cell">{item.name[0]}</td>
        <td className="hidden md:table-cell">
          {item.supervisorId ? (
            supervisorsMap.get(item.supervisorId) || 'Sin información'
          ) : (
            'Sin supervisor'
          )}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <>
                <FormContainer table="class" type="update" data={item} />
                <FormContainer table="class" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Construir la consulta base para la tabla Class
  let query = supabase
    .from('Class')
    .select(`
      id,
      name,
      capacity,
      gradeId,
      supervisorId,
      Grade:gradeId (id, level)
    `, { count: 'exact' });

  // Log para depuración - Consulta inicial
  console.log('DEBUG - Consulta inicial creada');

  // Aplicar filtros específicos
  if (supervisorIdFilter) {
    query = query.eq('supervisorId', supervisorIdFilter);
    console.log('DEBUG - Filtro por supervisor aplicado:', { supervisorIdFilter });
  }

  // Aplicar filtros según el rol
  if (role === "teacher") {
    // Si el profesor es supervisor de alguna clase
    query = query.eq('supervisorId', userId);
    console.log('DEBUG - Filtro para profesor como supervisor aplicado:', { userId });
  } else if (role === "student") {
    // Obtener la clase del estudiante a partir de la relación directa en la tabla Student
    const { data: studentData, error: studentError } = await supabase
      .from('Student')
      .select('classId')
      .eq('id', userId)
      .single();
    
    console.log('DEBUG - Datos del estudiante:', { studentData, studentError });
    
    if (studentData) {
      query = query.eq('id', studentData.classId);
    } else {
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <h1 className="text-lg font-semibold mb-4">Clases</h1>
          <p>No tienes una clase asignada.</p>
        </div>
      );
    }
  } else if (role === "parent") {
    // Obtener los estudiantes asignados al padre
    const { data: parentStudents } = await supabase
      .from('Student')
      .select('id, classId')
      .eq('parentId', userId);
    
    console.log('DEBUG - Estudiantes del padre:', parentStudents);
    
    if (parentStudents && parentStudents.length > 0) {
      // Obtener directamente los classId de los estudiantes
      const classIds = parentStudents.map(student => student.classId);
      
      // Filtrar las clases por estos IDs
      query = query.in('id', classIds);
    } else {
      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <h1 className="text-lg font-semibold mb-4">Clases</h1>
          <p>No tienes estudiantes asignados para ver sus clases.</p>
        </div>
      );
    }
  }

  // Aplicar filtros de búsqueda
  if (searchText) {
    // Log para depuración - Búsqueda
    console.log('DEBUG - Aplicando búsqueda:', { searchText });
    
    // Buscar por nombre de clase
    query = query.ilike('name', `%${searchText}%`);
  }

  // Paginación
  query = query
    .range((pageNum - 1) * ITEM_PER_PAGE, pageNum * ITEM_PER_PAGE - 1)
    .order('id', { ascending: false });

  // Log para depuración - Consulta final
  console.log('DEBUG - Consulta final antes de ejecutar');
  
  const { data, error, count } = await query;

  // Si tenemos datos, vamos a cargar los nombres de los supervisores por adelantado
  const supervisorsMap = new Map();
  
  if (data && data.length > 0) {
    // Obtener los IDs únicos de supervisores
    const supervisorIds = data
      .filter(item => item.supervisorId)
      .map(item => item.supervisorId)
      .filter((id, index, self) => self.indexOf(id) === index); // Filtrar duplicados
    
    if (supervisorIds.length > 0) {
      // Cargar todos los datos de supervisores en una sola consulta
      const { data: supervisorsData, error: supervisorsError } = await supabase
        .from('Teacher')
        .select('id, name, surname')
        .in('id', supervisorIds);
      
      if (!supervisorsError && supervisorsData) {
        // Crear un mapa para acceso rápido
        supervisorsData.forEach(supervisor => {
          supervisorsMap.set(supervisor.id, `${supervisor.name} ${supervisor.surname}`);
        });
      } else {
        console.error('Error al cargar datos de supervisores:', supervisorsError);
      }
    }
  }

  // Log para depuración - Resultados de la consulta
  console.log('DEBUG - Resultados:', { 
    dataLength: data?.length, 
    count, 
    error: error ? JSON.stringify(error) : null,
    primerRegistro: data && data.length > 0 ? JSON.stringify(data[0]) : null
  });

  if (error) {
    console.error('Error al obtener datos de clases:', error);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Clases</h1>
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
          Todas las clases
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
              <FormContainer table="class" type="create" />
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
          <p>No se encontraron clases.</p>
        </div>
      )}
      
      {/* PAGINATION */}
      <Pagination page={pageNum} count={count ?? 0} />
    </div>
  );
}
