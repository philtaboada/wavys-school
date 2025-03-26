'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useStudentList } from '@/utils/queries/studentQueries';
import { ArrowDownNarrowWide, ListFilterPlus, Eye, CircleUser } from 'lucide-react';
import { Student } from '@/utils/types';
import Link from 'next/link';

interface StudentClientTQProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function StudentClientTQ({ initialRole, initialUserId }: StudentClientTQProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Obtener valores de los parámetros de la URL
  const pageNum = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
  const classId = searchParams.get('classId') ? parseInt(searchParams.get('classId') as string, 10) : undefined;

  // Usar el hook de TanStack Query para obtener los datos
  const { data, isLoading, error } = useStudentList({
    page: pageNum,
    search: searchValue || undefined,
    classId
  });

  // Definir las columnas de la tabla
  const columns = [
    {
      header: "Información",
      accessor: "info",
    },
    {
      header: "ID del estudiante",
      accessor: "username",
      className: "hidden md:table-cell",
    },
    {
      header: "Grado",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Teléfono",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Dirección",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(initialRole === "admin"
      ? [
        {
          header: "Acciones",
          accessor: "action",
        },
      ]
      : []),
  ];

  // Función para renderizar cada fila
  const renderRow = (item: Student) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">
          <CircleUser className="w-10 h-10 rounded-full object-cover" />
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-xs text-gray-500">{item.Class?.name}</p>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.username}</td>
        <td className="hidden md:table-cell">{item.Class?.name?.[0] || '-'}</td>
        <td className="hidden lg:table-cell">{item.phone || "-"}</td>
        <td className="hidden lg:table-cell">{item.address || "-"}</td>
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/protected/list/students/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="#990000" d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"></path></svg>
              </button>
            </Link>
            {initialRole === "admin" && (
              <>
                <FormContainerTQ table="student" type="update" data={item} />
                <FormContainerTQ 
                  table="student" 
                  type="delete" 
                  id={typeof item.id === 'string' ? parseInt(item.id, 10) : item.id} 
                />
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
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Estudiantes</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos los estudiantes (con TanStack Query)
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellowLight transition-all cursor-pointer">
              <ListFilterPlus className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellowLight transition-all cursor-pointer">
              <ArrowDownNarrowWide className="w-4 h-4" />
            </button>
            {initialRole === "admin" && (
              <FormContainerTQ table="student" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="py-8 text-center">
          <p>Cargando listado de estudiantes...</p>
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron estudiantes.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 