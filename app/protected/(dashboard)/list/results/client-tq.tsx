'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useResultList } from '@/utils/queries/resultQueries';
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
    userRole: initialRole,
    userId: initialUserId
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
    ...((initialRole === "admin" || initialRole === "teacher")
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
        {(initialRole === "admin" || initialRole === "teacher") && (
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

  // Mostrar mensaje específico para roles no-admin sin resultados
  if (!isLoading && (!data?.data || data.data.length === 0)) {
    let message = "No hay resultados disponibles.";
    if (initialRole === "student") {
      message = "No tienes resultados registrados.";
    } else if (initialRole === "parent") {
      message = "Tus hijos no tienen resultados registrados.";
    } else if (initialRole === "teacher") {
      message = "No hay resultados para tus lecciones.";
    }
    
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Resultados</h1>
        <p>{message}</p>
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
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <ListFilterPlus className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <ArrowDownNarrowWide className="w-4 h-4" />
            </button>
            {(initialRole === "admin" || initialRole === "teacher") && (
              <FormContainerTQ table="result" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* Estado de depuración */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-blue-50 p-2 mb-4 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Información de depuración</summary>
            <p>Usuario: {initialUserId} (Rol: {initialRole})</p>
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
          <p>No se encontraron resultados.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 