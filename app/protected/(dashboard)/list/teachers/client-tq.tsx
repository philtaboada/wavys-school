'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useTeacherList } from '@/utils/queries/teacherQueries';
import { useUser } from '@/utils/hooks/useUser';
import { ListFilterPlus, Eye, RefreshCw } from 'lucide-react';
import { Teacher } from '@/utils/types/teacher';
import Link from 'next/link';
import Loading from '../loading';

// Definir tipo SearchParams
interface SearchParams {
  page?: string;
  search?: string;
  // Añadir otros filtros si aplican
  [key: string]: string | undefined;
}

interface TeacherClientTQProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Aceptar prop
}

export default function TeacherClientTQ({ 
  initialRole, 
  initialUserId, 
  searchParams: initialSearchParams // Renombrar
}: TeacherClientTQProps) {
  const currentSearchParams = useSearchParams(); // Parámetros actuales de la URL
  const router = useRouter();

  // Estado local para la búsqueda, inicializado desde props/URL inicial
  const [searchValue, setSearchValue] = useState(initialSearchParams?.search || '');

  // Obtener datos del usuario (usar initial como fallback si useUser no está listo)
  const { user } = useUser(initialRole, initialUserId);
  const userRole = user?.user_metadata?.role || initialRole;
  const userId = user?.id || initialUserId;

  // Leer parámetros ACTUALES de la URL para el hook
  const pageNum = parseInt(currentSearchParams.get('page') || "1", 10);
  const currentSearch = currentSearchParams.get('search') || undefined;
  // const subjectIdFilter = currentSearchParams.get('subjectId') ? parseInt(currentSearchParams.get('subjectId') as string, 10) : undefined;

  // Sincronizar estado local de búsqueda con la URL
  useEffect(() => {
      setSearchValue(currentSearch ?? '');
  }, [currentSearch]);

  // Usar el hook con parámetros ACTUALES de la URL (la queryKey debe coincidir con page.tsx)
  const { data, isLoading, error, refetch, isFetching } = useTeacherList({
    page: pageNum,
    search: currentSearch, 
    userRole,
    userId
    // Añadir otros filtros si aplican: subjectId: subjectIdFilter
  });

  // Función para forzar refetch manual
  const handleRefetch = () => {
    refetch();
  };

  // Definir las columnas de la tabla
  const columns = [
    {
      header: "Información",
      accessor: "info",
    },
    {
      header: "ID del profesor", // O 'Username' si se prefiere
      accessor: "username", // Asegurar que 'username' existe en el tipo Teacher
      className: "hidden md:table-cell",
    },
    {
      header: "Asignaturas",
      accessor: "subjects",
      className: "hidden md:table-cell",
    },
    {
      header: "Clases", // Puede requerir consulta adicional o ajuste
      accessor: "classes",
      className: "hidden lg:table-cell",
    },
    {
      header: "Teléfono",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Dirección", // Revisar si este campo se obtiene
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    // Acciones solo para admin
    ...(userRole === "admin"
      ? [
        {
          header: "Acciones",
          accessor: "action",
        },
      ]
      : [
         // Columna de acción para ver detalles (si no es admin)
         {
            header: "Detalles",
            accessor: "view",
          }
      ]),
  ];

  // Función para renderizar cada fila
  const renderRow = (item: Teacher) => {
    // Asegurarse que 'subjects' y 'classes' existen y tienen el formato esperado
    const subjectNames = item.subjects?.map((subject: { name: string }) => subject.name).join(", ") || "-";
    // const classNames = item.classes?.map((cls: { name: string }) => cls.name).join(", ") || "-"; // Asumiendo estructura
    const classNames = "-"; // Placeholder si no se obtiene info de clases aún

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        {/* Columna Información */}
        <td className="flex items-center gap-4 p-4">
          <Image
            src={item.img || "/noAvatar.png"}
            alt={`${item.name} ${item.surname}`}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => (e.currentTarget.src = '/noAvatar.png')}
          />
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name} {item.surname}</h3>
            <p className="text-xs text-gray-500">{item?.email ?? '-'}</p>
          </div>
        </td>
        {/* Otras columnas */}
        <td className="hidden md:table-cell p-2">{item.username ?? '-'}</td>
        <td className="hidden md:table-cell p-2">{subjectNames}</td>
        <td className="hidden lg:table-cell p-2">{classNames}</td>
        <td className="hidden lg:table-cell p-2">{item.phone || "-"}</td>
        <td className="hidden lg:table-cell p-2">{item.address || "-"}</td>
        {/* Columna Acciones / Ver */}
        <td className="p-2">
          <div className="flex items-center gap-2">
            {/* Botón Ver siempre presente */}
            <Link href={`/protected/list/teachers/${item.id}`} title="Ver Detalles">
               <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all cursor-pointer">
                 <Eye className="w-4 h-4" />
               </button>
            </Link>
            {/* Botones Editar/Eliminar solo para admin */}
            {userRole === "admin" && (
              <>
                <FormContainerTQ table="teacher" type="update" data={item} />
                <FormContainerTQ table="teacher" type="delete" id={item.id as any} />
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
    console.error("Error en TeacherClientTQ:", error);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Profesores</h1>
        <p>Se produjo un error al obtener los datos.</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {typeof error === 'object' && error !== null && 'message' in error 
            ? (error as {message: string}).message 
            : String(error)}
        </pre>
        <button 
          onClick={handleRefetch} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1 disabled:opacity-50"
          disabled={isFetching} // Deshabilitar si ya está recargando
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''}/>
          Intentar nuevamente
        </button>
      </div>
    );
  }

  // Mensaje específico para roles restringidos sin datos
  if (userRole !== 'admin' && !isLoading && !isFetching && (!data?.data || data.data.length === 0)) {
     let message = "No se encontraron profesores.";
     if (userRole === 'teacher') message = "No se encontró tu perfil de profesor.";
     else if (userRole === 'student') message = "No se encontraron profesores asociados a tus clases.";
     else if (userRole === 'parent') message = "No se encontraron profesores asociados a las clases de tus hijos.";
     
     return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            <h1 className="text-lg font-semibold mb-4">Profesores</h1>
            <p>{message}</p>
        </div>
     );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos los profesores
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
          <TableSearch
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-4 self-end">
            {/* Botón Refrescar */}
            <button 
              onClick={handleRefetch}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all cursor-pointer disabled:opacity-50"
              title="Actualizar datos"
              disabled={isFetching}
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''}/>
            </button>
             {/* Botón Filtro (funcionalidad pendiente) */}
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellowLight transition-all cursor-pointer" title="Filtrar (pendiente)">
              <ListFilterPlus className="w-4 h-4" />
            </button>
            {/* Botón Crear solo para admin */}
            {userRole === "admin" && (
              <FormContainerTQ table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LIST / Loading / No results */}
      {(isLoading && !data) || isFetching ? ( // Mostrar loading si carga inicial o refetching
        <div className="py-8 text-center">
          <Loading />
          {isFetching && !isLoading && <p className="text-sm text-gray-500 mt-2">Actualizando...</p>} 
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron profesores{currentSearch ? ` para "${currentSearch}"` : ''}.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      {data?.count != null && data.count > 0 && (
         <Pagination page={pageNum} count={data.count} />
      )}

      {/* Panel de depuración opcional */}
       {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 border-t pt-2 text-xs">
          <details>
            <summary className="cursor-pointer text-gray-500">Debug info</summary>
            <div className="mt-2 bg-gray-100 p-2 rounded">
              <p><strong>User Role:</strong> {userRole || 'N/A'}</p>
              <p><strong>User ID:</strong> {userId || 'N/A'}</p>
              <p><strong>Page:</strong> {pageNum}</p>
              <p><strong>Search:</strong> {currentSearch || 'N/A'}</p>
              <p><strong>Fetched Count:</strong> {data?.count ?? 'N/A'}</p>
              <p><strong>Is Loading:</strong> {isLoading.toString()}</p>
              <p><strong>Is Fetching:</strong> {isFetching.toString()}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
} 