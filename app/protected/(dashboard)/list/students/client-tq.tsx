'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useStudentList } from '@/utils/queries/studentQueries';
import { useUser } from '@/utils/hooks/useUser';
import { ArrowDownNarrowWide, ListFilterPlus, Eye, CircleUser } from 'lucide-react';
import { Student } from '@/utils/types/student';
import Link from 'next/link';
import Loading from '../loading';

// Definir tipo SearchParams
interface SearchParams {
  page?: string;
  search?: string;
  classId?: string;
  gradeId?: string;
  parentId?: string;
  [key: string]: string | undefined;
}

interface StudentClientTQProps {
  initialRole?: string;
  initialUserId?: string;
  searchParams?: SearchParams; // Aceptar prop
}

export default function StudentClientTQ({ 
  initialRole, 
  initialUserId, 
  searchParams: initialSearchParams // Renombrar
}: StudentClientTQProps) {
  const currentSearchParams = useSearchParams();
  const router = useRouter();

  // Estado local para búsqueda
  const [searchValue, setSearchValue] = useState(initialSearchParams?.search || '');

  // Usuario
  const { user } = useUser();
  const userRole = user?.user_metadata?.role || initialRole;
  const userId = user?.id || initialUserId;

  // Leer parámetros ACTUALES de URL
  const pageNum = parseInt(currentSearchParams.get('page') || "1", 10);
  const currentSearch = currentSearchParams.get('search') || undefined;
  const classId = currentSearchParams.get('classId') ? parseInt(currentSearchParams.get('classId') as string, 10) : undefined;
  const gradeId = currentSearchParams.get('gradeId') ? parseInt(currentSearchParams.get('gradeId') as string, 10) : undefined;
  const parentId = currentSearchParams.get('parentId') || undefined;

  // Sincronizar estado local
  useEffect(() => {
      setSearchValue(currentSearch ?? '');
  }, [currentSearch]);

  // Hook con parámetros ACTUALES
  const { data, isLoading, error } = useStudentList({
    page: pageNum,
    search: currentSearch,
    classId,
    gradeId, // Pasar gradeId
    parentId, // Pasar parentId
    // No necesita pasar role/userId ya que useStudentList no los usa directamente
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
  const renderRow = (item: Student) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">
          {item.img ? (
            <img 
                src={item.img} 
                alt={`${item.name} ${item.surname}`} 
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
             />
          ) : (
             <CircleUser className="w-10 h-10 rounded-full object-cover text-gray-400" />
          )}
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name} {item.surname}</h3>
            <p className="text-xs text-gray-500">{item.Class?.name ?? 'Sin clase'}</p>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.username ?? '-'}</td>
        <td className="hidden md:table-cell">{(item.Grade as { level?: string })?.level ?? '-'}</td>
        <td className="hidden lg:table-cell">{item.phone || "-"}</td>
        <td className="hidden lg:table-cell">{item.address || "-"}</td>
        <td>
          <div className="flex items-center gap-1">
            <Link href={`/protected/list/students/${item.id}`}>
              <Eye className="w-5 h-5 text-blue-600 hover:text-blue-800 cursor-pointer" />
            </Link>
            {userRole === "admin" && (
              <>
                <FormContainerTQ table="student" type="update" data={item} />
                <FormContainerTQ 
                  table="student" 
                  type="delete" 
                  id={item.id as any} 
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
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Estudiantes</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
           {typeof error === 'object' && error !== null && 'message' in error ? 
             (error as {message: string}).message : String(error)}
        </pre>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h1 className="hidden md:block text-lg font-semibold">
            Todos los estudiantes
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
              <TableSearch
                value={searchValue}
                onChange={handleSearchChange}
                onSearch={handleSearch}
              />
              <div className="flex items-center gap-4 self-end">
                  {userRole === "admin" && (
                    <FormContainerTQ table="student" type="create" />
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
           <p>No se encontraron estudiantes{currentSearch ? ` para "${currentSearch}"` : ''}.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />

      {/* Panel de depuración */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 border-t pt-2 text-xs">
          <details>
            <summary className="cursor-pointer text-gray-500">Debug info</summary>
            <div className="mt-2 bg-gray-100 p-2 rounded">
              <p><strong>User Role:</strong> {userRole || 'No disponible'}</p>
              <p><strong>User ID:</strong> {userId || 'No disponible'}</p>
              <p><strong>Initial Role:</strong> {initialRole || 'No disponible'}</p>
              <p><strong>Initial User ID:</strong> {initialUserId || 'No disponible'}</p>
              <p><strong>Page:</strong> {pageNum}</p>
              <p><strong>Search:</strong> {searchValue || 'No disponible'}</p>
              <p><strong>Class ID:</strong> {classId || 'No disponible'}</p>
              <p><strong>Grade ID:</strong> {gradeId || 'No disponible'}</p>
              <p><strong>Parent ID:</strong> {parentId || 'No disponible'}</p>
              <p><strong>Students count:</strong> {data?.count || 0}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
} 