'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useTeacherList } from '@/utils/queries/teacherQueries';
import { ArrowDownNarrowWide, ListFilterPlus, Eye } from 'lucide-react';
import { Teacher } from '@/utils/types';
import Link from 'next/link';

interface TeacherClientTQProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function TeacherClientTQ({ initialRole, initialUserId }: TeacherClientTQProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Obtener valores de los parámetros de la URL
  const pageNum = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
  const subjectId = searchParams.get('subjectId') ? parseInt(searchParams.get('subjectId') as string, 10) : undefined;

  // Usar el hook de TanStack Query para obtener los datos
  const { data, isLoading, error } = useTeacherList({
    page: pageNum,
    search: searchValue || undefined,
    subjectId
  });

  // Definir las columnas de la tabla
  const columns = [
    {
      header: "Información",
      accessor: "info",
    },
    {
      header: "ID del profesor",
      accessor: "username",
      className: "hidden md:table-cell",
    },
    {
      header: "Asignaturas",
      accessor: "subjects",
      className: "hidden md:table-cell",
    },
    {
      header: "Clases",
      accessor: "classes",
      className: "hidden lg:table-cell",
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
  const renderRow = (item: Teacher) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">
          <Image
            src={item.img || "/noAvatar.png"}
            alt=""
            width={40}
            height={40}
            className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-xs text-gray-500">{item?.email}</p>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.username}</td>
        <td className="hidden md:table-cell">
          {item.subjects?.map(subject => subject.name).join(", ") || "-"}
        </td>
        <td className="hidden lg:table-cell">
          {/* Las clases no están directamente en el modelo de Teacher, 
              podríamos implementarlo en el futuro */}
          -
        </td>
        <td className="hidden lg:table-cell">{item.phone || "-"}</td>
        <td className="hidden lg:table-cell">{item.address || "-"}</td>
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/protected/list/teachers/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple hover:bg-lamaPurpleLight transition-all cursor-pointer">
                <Eye className="w-4 h-4" />
              </button>
            </Link>
            {initialRole === "admin" && (
              <>
                <FormContainerTQ table="teacher" type="update" data={item} />
                <FormContainerTQ table="teacher" type="delete" id={Number(item.id)} />
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
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Profesores</h1>
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
          Todos los profesores (con TanStack Query)
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
              <FormContainerTQ table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="py-8 text-center">
          <p>Cargando listado de profesores...</p>
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron profesores.</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data.data} />
      )}

      {/* PAGINATION */}
      <Pagination page={pageNum} count={data?.count ?? 0} />
    </div>
  );
} 