import { useUserRole } from "@/utils/hooks";
import ClassClientWrapper from "./client-wrapper";
import getQueryClient from "@/lib/getQueryClient"; 
import { dehydrate } from "@tanstack/react-query"; 
import { createClient } from "@/utils/supabase/server"; 
import { useClassList } from "@/utils/queries/classQueries"; // Importar para queryKey
import { Class } from "@/utils/types/class"; // Importar tipo
import HydrationProvider from "@/components/providers/HydrationProvider";
import { ITEM_PER_PAGE } from "@/lib/settings"; // Importar para paginación

// Función para obtener clases en servidor (basada en useClassList optimizado)
async function getClasses(params: {
  page: number;
  search?: string;
  gradeId?: number;
  userRole?: string;
  userId?: string;
}) {
    const supabase = await createClient();
    const { page, search, gradeId, userRole, userId } = params;

     let specificClassIds: number[] | null = null;

      if (userRole && userRole !== 'admin' && userId) {
        if (userRole === 'student') {
          const { data: studentData } = await supabase.from('Student').select('classId').eq('id', userId).maybeSingle();
          if (studentData?.classId) {
            specificClassIds = [studentData.classId];
          } else {
            return { data: [], count: 0 };
          }
        } else if (userRole === 'parent') {
          const { data: parentStudents } = await supabase.from('Student').select('classId').eq('parentId', userId);
          if (parentStudents && parentStudents.length > 0) {
            specificClassIds = Array.from(new Set(parentStudents.map(s => s.classId).filter(id => id != null))) as number[];
            if (specificClassIds.length === 0) {
                 return { data: [], count: 0 };
            }
          } else {
            return { data: [], count: 0 };
          }
        }
      }

    let query = supabase
        .from('Class')
        .select(`
          id, name, capacity, gradeId, supervisorId,
          Grade:gradeId (id, level),
          Supervisor:supervisorId (id, name, surname),
          Student(count)
        `, { count: 'exact' });

    if (search) query = query.ilike('name', `%${search}%`);
    if (gradeId) query = query.eq('gradeId', gradeId);
    if (userRole === 'teacher' && userId) query = query.eq('supervisorId', userId);
    if (specificClassIds !== null) query = query.in('id', specificClassIds);

    const rangeStart = (page - 1) * ITEM_PER_PAGE;
    const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
    query = query.range(rangeStart, rangeEnd).order('name');

    type ClassWithNestedCount = Omit<Class, '_count'> & {
           Grade?: { id: number; level: string } | null;
           Supervisor?: { id: string; name: string; surname: string } | null;
           Student: { count: number }[];
      };
    const { data, error, count } = await query.returns<ClassWithNestedCount[]>();

    if (error) {
        console.error("Server-side class fetch error:", error);
        return { data: [], count: 0 };
    }

    const result: Class[] = data.map(classItem => ({
        id: classItem.id,
        name: classItem.name,
        capacity: classItem.capacity,
        gradeId: classItem.gradeId,
        supervisorId: classItem.supervisorId,
        Grade: classItem.Grade ?? undefined,
        Supervisor: classItem.Supervisor ?? undefined,
        _count: {
          students: classItem.Student[0]?.count ?? 0
        }
    }));

    return { data: result, count: count || 0 };
}

export default async function ClassListPage({
  searchParams: resolvedSearchParams, // Renombrar
}: {
  searchParams: { // No es Promise
    page?: string;
    search?: string;
    gradeId?: string;
    // Añadir otros posibles filtros si existen
    [key: string]: string | undefined;
  };
}) {
  const { role, userId } = await useUserRole();
  const queryClient = getQueryClient();

  // Parsear searchParams
  const page = parseInt(resolvedSearchParams?.page || "1", 10);
  const search = resolvedSearchParams?.search;
  const gradeId = resolvedSearchParams?.gradeId ? parseInt(resolvedSearchParams.gradeId, 10) : undefined;

  // QueryKey debe coincidir con useClassList
  const queryKey = ['class', 'list', page, search, gradeId, role, userId];

  // Prefetch
  await queryClient.prefetchQuery({
    queryKey: queryKey,
    queryFn: () => getClasses({ page, search, gradeId, userRole: role, userId }),
  });

  // Dehydrate
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationProvider state={dehydratedState}>
      <ClassClientWrapper 
        initialRole={role} 
        initialUserId={userId} 
        searchParams={resolvedSearchParams} // Pasar searchParams
      />
    </HydrationProvider>
  );
}
