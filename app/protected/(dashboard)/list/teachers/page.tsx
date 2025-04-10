import { useUserRole } from "@/utils/hooks";
import ClientWrapper from "./client-wrapper";
import getQueryClient from "@/lib/getQueryClient";
import { dehydrate } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/server";
import { Teacher, TeacherListResult } from "@/utils/types/teacher";
import HydrationProvider from "@/components/providers/HydrationProvider";
import { ITEM_PER_PAGE } from "@/lib/settings";

// Función para obtener profesores en servidor (basada en useTeacherList)
async function getTeachers(params: {
  page: number;
  search?: string;
  userRole?: string;
  userId?: string;
}): Promise<TeacherListResult> {
  const supabase = await createClient();
  const { page, search, userRole, userId } = params;

  // Construir la consulta base
  let query = supabase
    .from('Teacher')
    .select(`
      id, username, name, surname, email, phone, address, img, bloodType, sex, birthday, 
      subjects:subject_teacher ( subjectId, Subject (id, name) ), 
      classes:Class ( id, name ) 
    `, { count: 'exact' }); // Añadir relaciones necesarias

  // Aplicar filtros de búsqueda
  if (search) {
    query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Filtros específicos según el rol del usuario
  if (userRole && userRole !== 'admin' && userId) {
    if (userRole === 'teacher') {
      // Profesor solo se ve a sí mismo
      query = query.eq('id', userId);
    } else if (userRole === 'student') {
      // Profesores de las asignaturas/clases del estudiante
      const { data: studentClasses } = await supabase
        .from('Student')
        .select('classId')
        .eq('id', userId)
        .single();

      if (studentClasses?.classId) {
        const { data: teacherIdsData } = await supabase
          .from('Lesson')
          .select('teacherId')
          .eq('classId', studentClasses.classId);

        if (teacherIdsData && teacherIdsData.length > 0) {
          const uniqueTeacherIds = Array.from(new Set(teacherIdsData.map(t => t.teacherId)));
          query = query.in('id', uniqueTeacherIds);
        } else {
          return { data: [], count: 0 }; // No hay profesores para las clases del estudiante
        }
      } else {
        return { data: [], count: 0 }; // Estudiante sin clase
      }
    } else if (userRole === 'parent') {
      // Profesores de las asignaturas/clases de los hijos del padre
      const { data: childrenClasses } = await supabase
        .from('Student')
        .select('classId')
        .eq('parentId', userId);

      if (childrenClasses && childrenClasses.length > 0) {
        const classIds = Array.from(new Set(childrenClasses.map(c => c.classId).filter(id => id != null)));
         if (classIds.length === 0) {
             return { data: [], count: 0 };
         }
        const { data: teacherIdsData } = await supabase
          .from('Lesson')
          .select('teacherId')
          .in('classId', classIds);

        if (teacherIdsData && teacherIdsData.length > 0) {
          const uniqueTeacherIds = Array.from(new Set(teacherIdsData.map(t => t.teacherId)));
          query = query.in('id', uniqueTeacherIds);
        } else {
          return { data: [], count: 0 }; // No hay profesores para las clases de los hijos
        }
      } else {
        return { data: [], count: 0 }; // Padre sin hijos o hijos sin clase
      }
    }
  }

  // Paginación
  const rangeStart = (page - 1) * ITEM_PER_PAGE;
  const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
  query = query.range(rangeStart, rangeEnd).order('surname');

  // Ejecutar consulta
  const { data, error, count } = await query.returns<any[]>(); // Usar any[] temporalmente

  if (error) {
    console.error("Server-side teacher fetch error:", error);
    // Considera lanzar el error o devolver un estado de error específico
    // throw new Error(`Server Error: ${error.message}`); 
    return { data: [], count: 0 }; 
  }

  // Mapear resultados para ajustar la estructura si es necesario (como en useTeacherList)
   const resultData: Teacher[] = data.map((teacher: any) => ({
      ...teacher,
      // Asegurar que las fechas son objetos Date si es necesario
      birthday: teacher.birthday ? new Date(teacher.birthday) : undefined, 
      createdAt: teacher.createdAt ? new Date(teacher.createdAt) : undefined,
      // Mapear relaciones anidadas si la consulta las devuelve de forma diferente
      subjects: teacher.subjects?.map((st: any) => st.Subject).filter(Boolean) || [],
      // clases: teacher.classes || [], // Ya debería estar bien si la consulta está correcta
  }));

  return {
    data: resultData,
    count: count || 0
  };
}

export default async function TeacherListPage({
  searchParams: resolvedSearchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    // Añadir otros filtros si aplican (ej. subjectId)
    [key: string]: string | undefined;
  };
}) {
  const { role, userId } = await useUserRole();
  const queryClient = getQueryClient();

  // Parsear searchParams
  const page = parseInt(resolvedSearchParams?.page || "1", 10);
  const search = resolvedSearchParams?.search;
  // const subjectId = resolvedSearchParams?.subjectId ? parseInt(resolvedSearchParams.subjectId, 10) : undefined; // Ejemplo

  // QueryKey debe coincidir con useTeacherList
  // Incluir todos los parámetros que afectan la consulta
  const queryKey = ['teacher', 'list', page, search, role, userId]; // Añadir otros filtros si aplican

  // Prefetch
  await queryClient.prefetchQuery<TeacherListResult>({
    queryKey: queryKey,
    queryFn: () => getTeachers({ page, search, userRole: role, userId }), // Pasar todos los params
  });

  // Dehydrate
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationProvider state={dehydratedState}>
      <ClientWrapper
        initialRole={role}
        initialUserId={userId}
        searchParams={resolvedSearchParams}
      />
    </HydrationProvider>
  );
}
