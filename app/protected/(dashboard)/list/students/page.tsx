import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/utils/supabase/server";

// Tipos adaptados para Supabase
type Class = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  username: string;
  img: string | null;
  phone: string;
  address: string;
  class_id: string;
  class: Class;
};

// Utilizar la estructura de parámetros recomendada por Next.js 15
const StudentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    [key: string]: string | undefined;
  }>;
}) => {
  // Acceder a searchParams de forma asíncrona como recomienda Next.js 15
  const params = await searchParams;

  // Extrae los valores de forma segura
  const p = params.page ? parseInt(params.page, 10) : 1;
  const searchText = params.search || '';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Información",
      accessor: "info",
    },
    {
      header: "ID del estudiante",
      accessor: "studentId",
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
    ...(role === "admin"
      ? [
        {
          header: "Acciones",
          accessor: "action",
        },
      ]
      : []),
  ];

  const renderRow = (item: Student) => (
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
          <p className="text-xs text-gray-500">{item.class.name}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">{item.class.name[0]}</td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/protected/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="#990000" d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"></path></svg>
            </button>
          </Link>
          {role === "admin" && (
            <FormContainer table="student" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

  try {
    // Consulta con Supabase en lugar de Prisma
    let query = supabase
      .from('Student')
      .select(`
        id, name, username, img, phone, address, classId,
        class:Class(id, name)
      `, { count: 'exact' })
      .range((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE - 1);

    // Agregar filtros según los parámetros de URL
    if (searchText) {
      query = query.ilike('name', `%${searchText}%`);
    }

    // Obtener los datos
    const { data, count, error } = await query;

    if (error) {
      console.error("Error en la consulta principal:", error);
      return <div>Error al cargar los datos: {error.message}</div>;
    }

    // Formatear datos si es necesario
    const formattedData = data || [];

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        {/* TOP */}
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">Todos los estudiantes</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {role === "admin" && (
                <FormContainer table="student" type="create" />
              )}
            </div>
          </div>
        </div>
        {/* LIST */}
        <Table columns={columns} renderRow={renderRow} data={formattedData} />
        {/* PAGINATION */}
        <Pagination page={p} count={count || 0} />
      </div>
    );
  } catch (error) {
    console.error("Error inesperado:", error);
    return <div>Error inesperado al cargar los datos</div>;
  }
};

export default StudentListPage;
