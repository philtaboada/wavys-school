import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { createClient } from "@/utils/supabase/server";
import { useUserRole } from "@/utils/hooks";
import { ArrowDownNarrowWide, ListFilterPlus } from "lucide-react";

type Announcement = {
  id: number;
  title: string;
  description: string;
  date: Date;
  classId: number | null;
};

type AnnouncementList = Announcement & { class: { name: string } | null };

// Utilizar la estructura de parámetros recomendada por Next.js 15
export default async function AnnouncementListPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    search?: string;
    [key: string]: string | undefined;
  }>;
}) {
  // Acceder a searchParams de forma asíncrona como recomienda Next.js 15
  const params = await searchParams;
  
  // Extrae los valores de forma segura
  const pageNum = params.page ? parseInt(params.page, 10) : 1;
  const searchText = params.search || '';
  
  const supabase = await createClient();
  const { role, userId } = await useUserRole();
  const currentUserId = userId;
    
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
    ...(role === "admin"
      ? [
          {
            header: "Acciones",
            accessor: "action",
          },
        ]
      : []),
  ];
  
  const renderRow = (item: AnnouncementList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {item.date ? new Intl.DateTimeFormat("en-US").format(new Date(item.date)) : "-"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="announcement" type="update" data={item} />
              <FormContainer table="announcement" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  // Crear consulta con Supabase
  let query = supabase
    .from('Announcement')
    .select('*, Class:Class(*)', { count: 'exact' });

  // Filtros de búsqueda
  if (searchText) {
    query = query.ilike("title", `%${searchText}%`);
  }

  // Condiciones basadas en roles
  if (role === 'teacher') {
    query = query.or(`classId.is.null,class.lessons.teacherId.eq.${currentUserId}`);
  } else if (role === 'student') {
    query = query.or(`classId.is.null,class.students.id.eq.${currentUserId}`);
  } else if (role === 'parent') {
    query = query.or(`classId.is.null,class.students.parentId.eq.${currentUserId}`);
  }

  // Paginación
  query = query
    .range((pageNum - 1) * ITEM_PER_PAGE, pageNum * ITEM_PER_PAGE - 1)
    .order('id', { ascending: false });

  const { data, count, error } = await query;

  if (error) {
    console.error("Error al obtener anuncios:", error);
    return <div>Error al cargar los anuncios</div>;
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos los anuncios
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellowLight transition-all cursor-pointer">
              <ListFilterPlus className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellowLight transition-all cursor-pointer">
              <ArrowDownNarrowWide className="w-4 h-4" />
            </button>
            {role === "admin" && (
              <FormContainer table="announcement" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={pageNum} count={count ?? 0} />
    </div>
  );
}
