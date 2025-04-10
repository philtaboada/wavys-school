'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useAssignmentList } from '@/utils/queries/assignmentQueries';
import { ArrowDownNarrowWide, ListFilterPlus } from 'lucide-react';
import { Assignment } from '@/utils/types/assignment';
import Loading from '../loading';
import { UserInfo } from '@/components/user-info';
import { useUser } from '@/utils/hooks/useUser';

// Reutilizar la interfaz de ClientWrapper
interface SearchParams {
  page?: string;
  search?: string;
  classId?: string;
  teacherId?: string;
  [key: string]: string | undefined;
}

interface AssignmentsClientTQProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Aceptar searchParams
}

export default function AssignmentsClientTQ({ 
  initialRole, 
  initialUserId, 
  searchParams: initialSearchParams // Renombrar para claridad
}: AssignmentsClientTQProps) {
  // Usar useSearchParams para reactividad a cambios de URL
  const currentSearchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda (inicializado desde props)
  const [searchValue, setSearchValue] = useState(initialSearchParams?.search || '');

  // Obtener datos del usuario desde la caché (esto ya funciona con el estado hidratado)
  const { user, isAuthenticated } = useUser();
  const userRole = user?.user_metadata?.role || initialRole;
  const userId = user?.id || initialUserId;

  // **Leer parámetros ACTUALES de la URL para pasarlos al hook**
  // Esto asegura que si el usuario navega (ej. cambia página), el hook se actualiza.
  // Usamos los props iniciales SOLO para la primera carga (manejada por prefetch/hidratación).
  const pageNum = parseInt(currentSearchParams.get('page') || "1", 10);
  const currentSearch = currentSearchParams.get('search') || undefined;
  const classIdFilter = currentSearchParams.get('classId') ? parseInt(currentSearchParams.get('classId') as string, 10) : undefined;
  const teacherIdFilter = currentSearchParams.get('teacherId') || undefined;

  // Sincronizar el estado local de búsqueda si el parámetro URL cambia externamente
  useEffect(() => {
      setSearchValue(currentSearch ?? '');
  }, [currentSearch]);

  // Usar el hook de TanStack Query. Los datos iniciales vendrán de la caché hidratada.
  // Usar los parámetros ACTUALES de la URL para la queryKey y la ejecución.
  const { data, isLoading, error } = useAssignmentList({
    page: pageNum,
    search: currentSearch, // Usar valor actual de la URL
    classId: classIdFilter,
    teacherId: teacherIdFilter,
    role: userRole,
    userId: userId,
  });

  // Definir las columnas simples para la tabla
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
      header: "Fecha de entrega",
      accessor: "dueDate",
      className: "hidden md:table-cell",
    },
    ...(userRole === "admin" || userRole === "teacher"
      ? [
          {
            header: "Acciones",
            accessor: "action",
          },
        ]
      : []),
  ];

  // Reinstaurar la función renderRow
  const renderRow = (item: Assignment) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{item.title}</td>
        <td>{item.lesson?.subject?.name || 'N/A'}</td>
        <td>{item.lesson?.class?.name || 'N/A'}</td>
        <td className="hidden md:table-cell">
          {item.lesson?.teacher ? 
            `${item.lesson.teacher.name} ${item.lesson.teacher.surname}` : 
            'N/A'}
        </td>
        <td className="hidden md:table-cell">
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
        </td>
        <td>
          <div className="flex items-center gap-1">
            {(userRole === "admin" || (userRole === "teacher" && item.lesson?.teacher?.id === userId)) && (
              <>
                <FormContainerTQ table="assignment" type="update" data={item} />
                <FormContainerTQ table="assignment" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Manejar el cambio en la búsqueda (actualiza estado local)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // Manejar el envío del formulario de búsqueda (actualiza URL)
  const handleSearch = () => {
    const params = new URLSearchParams(currentSearchParams.toString());
    if (searchValue) {
        params.set('search', searchValue);
    } else {
        params.delete('search');
    }
    params.set('page', '1'); // Resetear a la primera página al buscar
    router.push(`?${params.toString()}`);
  };

  // Mostrar mensaje de error si ocurre
  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Tareas</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {typeof error === 'object' && error !== null && 'message' in error ? 
            (error as {message: string}).message : String(error)}
        </pre>
      </div>
    );
  }

  // Mostrar mensajes específicos según el rol y resultados
  if (userRole === "teacher" && data?.data.length === 0 && !isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Tareas</h1>
        <p>No tienes lecciones asignadas para ver tareas.</p>
      </div>
    );
  }

  if (userRole === "student" && data?.data.length === 0 && !isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Tareas</h1>
        <p>No hay tareas asignadas para tu clase.</p>
      </div>
    );
  }

  if (userRole === "parent" && data?.data.length === 0 && !isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Tareas</h1>
        <p>No tienes estudiantes asignados para ver sus tareas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos los trabajos
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
          <TableSearch
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-4 self-end">
            {(userRole === "admin" || userRole === "teacher") && (
              <FormContainerTQ table="assignment" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      {isLoading && !data ? (
        <div className="py-8 text-center">
          <Loading />
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron tareas{currentSearch ? ` para "${currentSearch}"` : ''}.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 