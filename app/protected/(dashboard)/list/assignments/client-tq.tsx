'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useAssignmentList } from '@/utils/queries/assignmentQueries';
import { ArrowDownNarrowWide, ListFilterPlus } from 'lucide-react';
import { Assignment } from '@/utils/types';

interface AssignmentsClientTQProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function AssignmentsClientTQ({ initialRole, initialUserId }: AssignmentsClientTQProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Obtener valores de los parámetros de la URL
  const pageNum = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
  const classIdFilter = searchParams.get('classId') ? parseInt(searchParams.get('classId') as string, 10) : undefined;
  const teacherIdFilter = searchParams.get('teacherId') || undefined;

  // Usar el hook de TanStack Query para obtener los datos
  const { data, isLoading, error } = useAssignmentList({
    page: pageNum,
    search: searchValue || undefined,
    classId: classIdFilter,
    teacherId: teacherIdFilter,
    role: initialRole,
    userId: initialUserId,
  });

  // Definir las columnas de la tabla
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
    ...(initialRole === "admin" || initialRole === "teacher"
      ? [
          {
            header: "Acciones",
            accessor: "action",
          },
        ]
      : []),
  ];

  // Función para renderizar cada fila
  const renderRow = (item: Assignment) => {
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
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(initialRole === "admin" || (initialRole === "teacher" && item.lesson?.teacher?.id === initialUserId)) && (
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

  // Manejar el cambio en la búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // Manejar el envío del formulario de búsqueda
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('search', searchValue);
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
  if (initialRole === "teacher" && data?.data.length === 0 && !isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Tareas</h1>
        <p>No tienes lecciones asignadas para ver tareas.</p>
      </div>
    );
  }

  if (initialRole === "student" && data?.data.length === 0 && !isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Tareas</h1>
        <p>No hay tareas asignadas para tu clase.</p>
      </div>
    );
  }

  if (initialRole === "parent" && data?.data.length === 0 && !isLoading) {
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
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos los trabajos (con TanStack Query)
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <ListFilterPlus className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <ArrowDownNarrowWide className="w-4 h-4" />
            </button>
            {(initialRole === "admin" || initialRole === "teacher") && (
              <FormContainerTQ table="assignment" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* Estado de depuración en entorno de desarrollo */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-blue-50 p-2 mb-4 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Información de depuración</summary>
            <p>Usuario: {initialUserId} (Rol: {initialRole})</p>
            <p>Página: {pageNum}, Búsqueda: "{searchValue}"</p>
            <p>Registros: {data?.count ?? 0}</p>
            {error && (
              <div className="mt-2 text-red-600">
                <p>Error: {typeof error === 'object' && error !== null && 'message' in error ? 
                  (error as {message: string}).message : String(error)}</p>
              </div>
            )}
          </details>
        </div>
      )}

      {/* LIST */}
      {isLoading ? (
        <div className="py-8 text-center">
          <p>Cargando datos de tareas...</p>
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron tareas.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 