'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useClassList } from '@/utils/queries/classQueries';
import { ArrowDownNarrowWide, ListFilterPlus } from 'lucide-react';
import { Class } from '@/utils/types/class';
import Loading from '../loading';
import { useUser } from '@/utils/hooks/useUser';

// Definir tipo SearchParams
interface SearchParams {
  page?: string;
  search?: string;
  gradeId?: string;
  [key: string]: string | undefined;
}

interface ClassClientTQProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Aceptar prop
}

export default function ClassClientTQ({ 
  initialRole, 
  initialUserId, 
  searchParams: initialSearchParams // Renombrar
}: ClassClientTQProps) {
  const currentSearchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda, inicializado desde props
  const [searchValue, setSearchValue] = useState(initialSearchParams?.search || '');

  const { user, isAuthenticated } = useUser();
  const userRole = user?.user_metadata?.role || initialRole;
  const userId = user?.id || initialUserId;

  // Leer parámetros ACTUALES de la URL
  const pageNum = parseInt(currentSearchParams.get('page') || "1", 10);
  const currentSearch = currentSearchParams.get('search') || undefined;
  const gradeIdFilter = currentSearchParams.get('gradeId') ? parseInt(currentSearchParams.get('gradeId') as string, 10) : undefined;
  // Añadir otros filtros si existen (ej. supervisorId)
  // const supervisorIdFilter = currentSearchParams.get('supervisorId') || undefined;

  // Sincronizar estado local de búsqueda
  useEffect(() => {
      setSearchValue(currentSearch ?? '');
  }, [currentSearch]);

  // Usar el hook con parámetros ACTUALES de la URL
  const { data, isLoading, error } = useClassList({
    page: pageNum,
    search: currentSearch, // Usar valor actual de URL
    gradeId: gradeIdFilter,
    // supervisorId: supervisorIdFilter, // Añadir si se usa filtro
    userRole: userRole,
    userId: userId
  });

  // Definir columnas (sin cambios)
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
    ...(userRole === "admin"
      ? [
        {
          header: "Acciones",
          accessor: "action",
        },
      ]
      : []),
  ];

  // Función renderRow (sin cambios significativos, asegurar tipos)
  const renderRow = (item: Class) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{item.name}</td>
        <td className="hidden md:table-cell">{item.capacity ?? '-'}</td>
        <td className="hidden md:table-cell">{item.Grade ? item.Grade.level : '-'}</td>
        <td className="hidden md:table-cell">
          {item.Supervisor 
            ? `${item.Supervisor.name} ${item.Supervisor.surname}` 
            : '-'}
        </td>
        <td>
          <div className="flex items-center gap-1">
            {userRole === "admin" && (
              <>
                {/* Asegurar que data tenga el tipo correcto si es necesario */}
                <FormContainerTQ table="class" type="update" data={item as any} /> 
                <FormContainerTQ table="class" type="delete" id={Number(item.id)} />
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
    const params = new URLSearchParams(currentSearchParams.toString());
    if (searchValue) {
      params.set('search', searchValue);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); 
    router.push(`?${params.toString()}`);
  };

  // Mostrar mensaje de error si ocurre
  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Clases</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {typeof error === 'object' && error !== null && 'message' in error ? 
            (error as {message: string}).message : String(error)}
        </pre>
      </div>
    );
  }

  // Mostrar mensaje específico para roles no-admin sin clases
  if ((userRole === "student" || userRole === "parent" || userRole === "teacher") && !isLoading && (!data?.data || data.data.length === 0)) {
    let message = "No tienes clases disponibles.";
    if (userRole === "student") {
      message = "No tienes una clase asignada.";
    } else if (userRole === "parent") {
      message = "No tienes estudiantes asignados para ver sus clases.";
    } else if (userRole === "teacher") {
      message = "No eres supervisor de ninguna clase.";
    }
    
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Clases</h1>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h1 className="hidden md:block text-lg font-semibold">
          Todas las clases
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
          <TableSearch
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-4 self-end">
             {/* Quitar botones filtro/orden no implementados */}
            {/* <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <ListFilterPlus className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <ArrowDownNarrowWide className="w-4 h-4" />
            </button> */}
            {userRole === "admin" && (
              <FormContainerTQ table="class" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* Estado de depuración */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-blue-50 p-2 mb-4 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Información de depuración</summary>
            <p>Usuario: {userId} (Rol: {userRole})</p>
            <p>Página: {pageNum}, Búsqueda: "{currentSearch}"</p>
            <p>Registros: {data?.count ?? 0}</p>
          </details>
        </div>
      )}

      {/* LIST */}
      {isLoading && !data ? (
        <div className="py-8 text-center">
          <Loading />
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron clases{currentSearch ? ` para "${currentSearch}"` : ''}.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 