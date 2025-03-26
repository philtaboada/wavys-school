'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useAttendanceList } from '@/utils/queries/attendanceQueries';
import { ArrowDownNarrowWide, ListFilterPlus } from 'lucide-react';
import { Attendance } from '@/utils/types';

interface AttendanceClientTQProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function AttendanceClientTQ({ initialRole, initialUserId }: AttendanceClientTQProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Obtener valores de los parámetros de la URL
  const pageNum = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;

  // Usar el hook de TanStack Query para obtener los datos
  const { data, isLoading, error } = useAttendanceList({
    page: pageNum,
    search: searchValue || undefined,
    role: initialRole,
    userId: initialUserId,
  });

  // Definir las columnas de la tabla
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
          {item.date instanceof Date ? item.date.toLocaleDateString() : new Date(item.date).toLocaleDateString()}
        </td>
        <td className="hidden md:table-cell">
          <span className={`p-2 rounded-md ${item.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {item.present ? 'Presente' : 'Ausente'}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(initialRole === "admin" || initialRole === "teacher") && (
              <>
                <FormContainerTQ table="attendance" type="update" data={item} />
                <FormContainerTQ table="attendance" type="delete" id={item.id} />
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
        <h1 className="text-lg font-semibold mb-4">Error en Registro de Asistencia</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </div>
    );
  }

  // Mostrar mensajes específicos según el rol y resultados
  if (initialRole === "teacher" && data?.data.length === 0 && !isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">Registro de Asistencia</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <ListFilterPlus className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <ArrowDownNarrowWide className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <p className="my-4">No tienes lecciones asignadas para gestionar asistencia.</p>
      </div>
    );
  }

  if (initialRole === "parent" && data?.data.length === 0 && !isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Registro de Asistencia</h1>
        <p>No tienes estudiantes asignados para ver su asistencia.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Registro de Asistencia (con TanStack Query)
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
            {initialRole === "admin" && (
              <FormContainerTQ table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="py-8 text-center">
          <p>Cargando datos de asistencia...</p>
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron registros de asistencia.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 