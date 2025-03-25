import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

type Event = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  classId?: string;
  class?: {
    id: string;
    name: string;
  };
};

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;
  const role = (user?.user_metadata as { role?: string })?.role;

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
    {
      header: "Hora de inicio",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "Hora de fin",
      accessor: "endTime",
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

  const renderRow = (item: Event) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(new Date(item.startTime))}
      </td>
      <td className="hidden md:table-cell">
        {new Date(item.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {new Date(item.endTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  let query = supabase
    .from('Event')
    .select('*, class:classId(id, name)', { count: 'exact' });

  if (queryParams.search) {
    query = query.ilike('title', `%${queryParams.search}%`);
  }

  let userClassIds: string[] = [];

  if (role !== 'admin') {
    if (role === 'teacher') {
      const { data: classes } = await supabase
        .from('Lesson')
        .select('classId')
        .eq('teacherId', currentUserId);

      userClassIds = classes?.map(c => c.classId) || [];
    } else if (role === 'student') {
      const { data: classes } = await supabase
        .from('Student')
        .select('classId')
        .eq('id', currentUserId);

      userClassIds = classes?.map(c => c.classId) || [];
    } else if (role === 'parent') {
      const { data: classes } = await supabase
        .from('Student')
        .select('classId')
        .eq('parentId', currentUserId);

      userClassIds = classes?.map(c => c.classId) || [];
    }

    // Filtrar eventos por clases del usuario o eventos sin clase (globales)
    if (userClassIds.length > 0) {
      query = query.or(`classId.is.null,classId.in.(${userClassIds.join(',')})`);
    } else {
      query = query.is('classId', null);
    }
  }

  // Ejecutar la consulta para datos y conteo
  const { data, count, error } = await query
    .range(ITEM_PER_PAGE * (p - 1), ITEM_PER_PAGE * p - 1)
    .order('startTime', { ascending: false });


  if (error) {
    console.error('Error al obtener eventos:', error);
    return <div>Error al obtener eventos</div>;
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Todos los eventos</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="event" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
        <Table columns={columns} renderRow={renderRow} data={data} />
        {/* PAGINATION */}
      <Pagination page={p} count={count || 0} />
    </div>
  );
};

export default EventListPage;
