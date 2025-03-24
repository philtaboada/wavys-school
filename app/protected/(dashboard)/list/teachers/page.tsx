import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { createClient } from '@/utils/supabase/server';
import Image from "next/image";
import Link from "next/link";

// Constante para la paginación
const ITEM_PER_PAGE = 10;

// Tipos para los datos de Supabase
type Teacher = {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  address: string;
  img: string | null;
};

type Subject = {
  id: number;
  name: string;
};

type Class = {
  id: number;
  name: string;
};

// Definimos interfaces genéricas para los resultados de las consultas
interface LessonRecord {
  teacher_id: number;
  class_id: number;
}

interface SubjectTeacherRecord {
  subject_id: number;
  teacher_id: number;
}

type TeacherList = Teacher & { subjects: Subject[] } & { classes: Class[] };

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Crear el cliente de Supabase
  const supabase = await createClient();
  
  // Obtener el usuario actual y su rol
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user?.id)
    .single();
  
  const role = userProfile?.role;
  
  const columns = [
    {
      header: "Información",
      accessor: "info",
    },
    {
      header: "ID del profesor",
      accessor: "teacherId",
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

  const renderRow = (item: TeacherList) => (
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
        {item.subjects.map((subject: Subject) => subject.name).join(",")}
      </td>
      <td className="hidden md:table-cell">
        {item.classes.map((classItem: Class) => classItem.name).join(",")}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"><path fill="white" d="m14.06 9.02l.92.92L5.92 19H5v-.92zM17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z"></path></svg>
            </button>
          </Link>
          {role === "admin" && (
            <FormContainer table="teacher" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );
  
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  
  // Construir la consulta para Supabase
  let query = supabase.from('teacher').select('*');
  
  // Aplicar filtros basados en searchParams
  if (queryParams.search) {
    query = query.ilike('name', `%${queryParams.search}%`);
  }
  
  // Variable para almacenar el total de registros
  let count = 0;
  
  if (queryParams.classId) {
    // Primero obtenemos las lecciones que corresponden a la clase
    const { data: lessonsData } = await supabase
      .from('lesson')
      .select('teacher_id')
      .eq('class_id', parseInt(queryParams.classId));
    
    if (lessonsData && lessonsData.length > 0) {
      const teacherIds = lessonsData.map(lesson => lesson.teacher_id);
      query = query.in('id', teacherIds);
    }
  }
  
  // Contar el total de registros para paginación
  const countResult = await query.count();
  count = countResult.count || 0;
  
  // Obtener los datos paginados
  const { data: teachersData } = await query
    .range((p - 1) * ITEM_PER_PAGE, p * ITEM_PER_PAGE - 1);
  
  // Para cada profesor, obtener sus asignaturas y clases
  const data: TeacherList[] = [];
  
  if (teachersData) {
    for (const teacher of teachersData) {
      // Obtener asignaturas del profesor
      const { data: subjectsData } = await supabase
        .from('subject_teacher')
        .select('subject_id')
        .eq('teacher_id', teacher.id);
      
      const subjectIds = subjectsData?.map(item => item.subject_id) || [];
      
      let subjects: Subject[] = [];
      if (subjectIds.length > 0) {
        const { data: subjectsInfo } = await supabase
          .from('subject')
          .select('id, name')
          .in('id', subjectIds);
        
        subjects = subjectsInfo || [];
      }
      
      // Obtener clases del profesor
      const { data: lessonsData } = await supabase
        .from('lesson')
        .select('class_id')
        .eq('teacher_id', teacher.id);
      
      const classIds = Array.from(new Set(lessonsData?.map(item => item.class_id) || []));
      
      let classes: Class[] = [];
      if (classIds.length > 0) {
        const { data: classesInfo } = await supabase
          .from('class')
          .select('id, name')
          .in('id', classIds);
        
        classes = classesInfo || [];
      }
      
      data.push({
        ...teacher,
        subjects,
        classes
      } as TeacherList);
    }
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Todos los profesores</h1>
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
              <FormContainer table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TeacherListPage;
