'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useExamList } from '@/utils/queries/examQueries';
import { ArrowDownNarrowWide, ListFilterPlus } from 'lucide-react';
import { Exam } from '@/utils/types/exam';
import Loading from '../loading';

interface ExamClientTQProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function ExamClientTQ({ initialRole, initialUserId }: ExamClientTQProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Obtener valores de los parámetros de la URL
  const pageNum = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
  const classId = searchParams.get('classId') ? parseInt(searchParams.get('classId') as string, 10) : undefined;
  const teacherId = searchParams.get('teacherId') || undefined;
  const subjectId = searchParams.get('subjectId') ? parseInt(searchParams.get('subjectId') as string, 10) : undefined;
  const lessonId = searchParams.get('lessonId') ? parseInt(searchParams.get('lessonId') as string, 10) : undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  // Filtros específicos según el rol
  const queryParams = {
    page: pageNum,
    search: searchValue || undefined,
    classId,
    teacherId,
    subjectId,
    lessonId,
    startDate,
    endDate
  };

  // Si el usuario es un profesor, solo ver sus exámenes
  if (initialRole === "teacher") {
    queryParams.teacherId = initialUserId;
  }

  // Usar el hook de TanStack Query para obtener los datos
  const { data, isLoading, error } = useExamList(queryParams);

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
      header: "Fecha",
      accessor: "date",
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
  const renderRow = (item: Exam) => {
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
          {item.startTime ? new Date(item.startTime).toLocaleDateString() : 'N/A'}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(initialRole === "admin" || (initialRole === "teacher" && item.lesson?.teacher?.id === initialUserId)) && (
              <>
                <FormContainerTQ table="exam" type="update" data={item} />
                <FormContainerTQ table="exam" type="delete" id={Number(item.id)} />
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
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Exámenes</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </div>
    );
  }

  // Si el usuario es estudiante o padre y no hay datos (se maneja en el hook)
  if ((initialRole === "student" || initialRole === "parent") && !data?.data?.length) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Exámenes</h1>
        <p>No hay exámenes disponibles para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos los exámenes
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
              <FormContainerTQ table="exam" type="create" />
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
          <p>No se encontraron exámenes.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 