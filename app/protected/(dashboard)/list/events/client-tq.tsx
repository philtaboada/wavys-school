'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useEventList } from '@/utils/queries/eventQueries';
import { ArrowDownNarrowWide, ListFilterPlus } from 'lucide-react';
import { Event } from '@/utils/types/event';
import Loading from '../loading';
import { useUser } from '@/utils/hooks/useUser';

interface EventClientTQProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function EventClientTQ({ initialRole, initialUserId }: EventClientTQProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Obtener datos del usuario desde la caché de TanStack Query
  const { user, isAuthenticated } = useUser();
  
  // Utilizar datos del usuario desde la caché o los props iniciales
  const userRole = user?.user_metadata?.role || initialRole;
  const userId = user?.id || initialUserId;

  // Obtener valores de los parámetros de la URL
  const pageNum = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
  const classId = searchParams.get('classId') || undefined;

  // Usar el hook de TanStack Query para obtener los datos
  const { data, isLoading, error } = useEventList({
    page: pageNum,
    search: searchValue || undefined,
    classId,
    userRole: userRole,
    userId: userId
  });

  // Definir las columnas de la tabla
  const columns = [
    {
      header: "Título",
      accessor: "title",
    },
    {
      header: "Clase",
      accessor: "class",
    },
    {
      header: "Fecha",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    {
      header: "Hora de inicio",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "Hora de fin",
      accessor: "endTime",
      className: "hidden md:table-cell",
    },
    ...(userRole === "admin"
      ? [
        {
          header: "Acciones",
          accessor: "action",
        },
      ]
      : []),
  ];

  // Función para renderizar cada fila
  const renderRow = (item: Event) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.title}</td>
        <td>{item.class?.name || "-"}</td>
        <td className="hidden md:table-cell">
          {new Intl.DateTimeFormat("es-ES").format(new Date(item.startTime))}
        </td>
        <td className="hidden md:table-cell">
          {new Date(item.startTime).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </td>
        <td className="hidden md:table-cell">
          {new Date(item.endTime).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {userRole === "admin" && (
              <>
                <FormContainerTQ table="event" type="update" data={item as any} />
                <FormContainerTQ table="event" type="delete" id={typeof item.id === 'string' ? Number(item.id) : item.id} />
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
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Eventos</h1>
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
          Todos los eventos
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
            {userRole === "admin" && (
              <FormContainerTQ table="event" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* Estado de depuración en entorno de desarrollo */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-blue-50 p-2 mb-4 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Información de depuración</summary>
            <p>Usuario: {userId} (Rol: {userRole})</p>
            <p>Página: {pageNum}, Búsqueda: "{searchValue}"</p>
            <p>Registros: {data?.count ?? 0}</p>
          </details>
        </div>
      )}

      {/* LIST */}
      {isLoading ? (
        <div className="py-8 text-center">
          <Loading />
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron eventos.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 