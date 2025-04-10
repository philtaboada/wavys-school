'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useResultList } from '@/utils/queries/resultQueries';
import { useUser } from '@/utils/hooks/useUser';
import { ArrowDownNarrowWide, ListFilterPlus } from 'lucide-react';
import { ResultDisplay } from '@/utils/queries/resultQueries';
import Loading from '../loading';

interface ResultClientTQProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ResultClientTQ({ initialRole, initialUserId }: ResultClientTQProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Obtener datos del usuario desde el caché
  const { user } = useUser();
  const userRole = user?.user_metadata?.role || initialRole;
  const userId = user?.id || initialUserId;

  // Obtener valores de los parámetros de la URL
  const pageNum = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
  const studentId = searchParams.get('studentId') || undefined;
  const examId = searchParams.get('examId') ? parseInt(searchParams.get('examId') as string, 10) : undefined;
  const assignmentId = searchParams.get('assignmentId') ? parseInt(searchParams.get('assignmentId') as string, 10) : undefined;
  
  // Usar el hook de TanStack Query para obtener los datos
  const { data, isLoading, error } = useResultList({
    page: pageNum,
    search: searchValue || undefined,
    studentId,
    examId,
    assignmentId,
    userRole,
    userId
  });

  // Definir las columnas de la tabla
  const columns = [
    {
      header: "Título",
      accessor: "title",
    },
    {
      header: "Estudiante",
      accessor: "student",
    },
    {
      header: "Calificación",
      accessor: "score",
      className: "hidden md:table-cell",
    },
    {
      header: "Profesor",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Clase",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Fecha",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    ...((userRole === "admin" || userRole === "teacher")
      ? [
        {
          header: "Acciones",
          accessor: "action",
        },
      ]
      : []),
  ];

  // Función para renderizar cada fila
  const renderRow = (item: ResultDisplay) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.title}</td>
        <td>{`${item.studentName} ${item.studentSurname}`}</td>
        <td className="hidden md:table-cell">{item.score}</td>
        <td className="hidden md:table-cell">
          {`${item.teacherName} ${item.teacherSurname}`}
        </td>
        <td className="hidden md:table-cell">{item.className}</td>
        <td className="hidden md:table-cell">
          {item.startTime ? new Date(item.startTime).toLocaleDateString() : 'N/A'}
        </td>
        {(userRole === "admin" || userRole === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              <FormContainerTQ table="result" type="update" data={item as any} />
              <FormContainerTQ table="result" type="delete" id={Number(item.id)} />
            </div>
          </td>
        )}
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
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Resultados</h1>
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
          Todos los resultados
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
            {userRole === "admin" && (
              <FormContainerTQ table="result" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="py-8 text-center">
          <Loading />
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          {userRole === "student" ? (
            <p>No tienes resultados disponibles.</p>
          ) : userRole === "teacher" ? (
            <p>No hay resultados disponibles para tus estudiantes.</p>
          ) : (
            <p>No se encontraron resultados.</p>
          )}
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
              <p><strong>Student ID:</strong> {studentId || 'No disponible'}</p>
              <p><strong>Exam ID:</strong> {examId || 'No disponible'}</p>
              <p><strong>Results count:</strong> {data?.count || 0}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
} 