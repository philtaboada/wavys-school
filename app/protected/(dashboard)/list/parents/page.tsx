import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { ArrowDownNarrowWide, ListFilterPlus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { useUserRole } from "@/utils/hooks";
import { Parent } from "@/utils/types";

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    search?: string;
    [key: string]: string | undefined;
  }>;
}) => {
  // Acceder a searchParams de forma asíncrona
  const params = await searchParams;
  
  // Extrae los valores de forma segura
  const p = params.page ? parseInt(params.page, 10) : 1;
  const searchText = params.search || '';

  const supabase = await createClient();
  const { role } = await useUserRole();

  const columns = [
    {
      header: "Información",
      accessor: "info",
    },
    {
      header: "Nombres de los estudiantes",
      accessor: "students",
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

  const renderRow = (item: Parent) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {Array.isArray(item.students) 
          ? item.students
              .filter(student => student && typeof student === 'object')
              .map(student => student.name || 'Sin nombre')
              .join(", ")
          : "Sin estudiantes"}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="parent" type="update" data={item} />
              <FormContainer table="parent" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  try {
    // Consulta Supabase para obtener padres con sus estudiantes
    let query = supabase
      .from('Parent')
      .select(`
        id, name, email, phone, address,
        students:Student(id, name)
      `, { count: 'exact' })
      .range((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE - 1);

    // Agregar filtro de búsqueda si existe
    if (searchText) {
      query = query.ilike('name', `%${searchText}%`);
    }

    // Obtener los datos
    const { data, count, error } = await query;
    
    if (error) {
      console.error("Error en la consulta de padres:", error);
      return <div>Error al cargar los datos: {error.message}</div>;
    }

    // Formatear los datos para que coincidan con el formato esperado
    const formattedData = data?.map(parent => {
      return {
        ...parent,
        // Asegurarse de que students sea siempre un array
        students: Array.isArray(parent.students) ? parent.students : []
      };
    }) || [];

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        {/* TOP */}
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">Todos los padres</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <ListFilterPlus className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <ArrowDownNarrowWide className="w-4 h-4" />
              </button>
              {role === "admin" && <FormContainer table="parent" type="create" />}
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

export default ParentListPage;
