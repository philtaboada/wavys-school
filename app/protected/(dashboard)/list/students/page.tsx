import { useUserRole } from "@/utils/hooks";
import ClientWrapper from "./client-wrapper";
import getQueryClient from "@/lib/getQueryClient";
import { dehydrate } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/server";
import { useStudentList } from "@/utils/queries/studentQueries"; // Para QueryKey y tipos
import { Student, StudentListResult } from "@/utils/types/student"; // Tipos
import HydrationProvider from "@/components/providers/HydrationProvider";
import { ITEM_PER_PAGE } from "@/lib/settings";

// Función para obtener estudiantes en servidor (basada en useStudentList)
async function getStudents(params: {
  page: number;
  search?: string;
  classId?: number;
  gradeId?: number;
  parentId?: string;
  userRole?: string;
  userId?: string;
}): Promise<StudentListResult> {
    const supabase = await createClient();
    const { page, search, classId, gradeId, parentId, userRole, userId } = params;

    // --- Inicio: Logs de depuración ---
    console.log(`[getStudents Debug] Received params:`, params);
    console.log(`[getStudents Debug] userRole: ${userRole}, userId: ${userId}`);
    // --- Fin: Logs de depuración ---

    let query = supabase
        .from('Student')
        .select(`
          id, username, name, surname, email, phone, address, img, bloodType, sex, birthday, parentId, classId, gradeId,
          Class (id, name),
          Grade (id, level),
          Parent (id, name, surname)
        `, { count: 'exact' });

    if (userRole === 'teacher' && userId) {
      // --- Inicio: Log de depuración ---
      console.log(`[getStudents Debug] Applying TEACHER filter for userId: ${userId}`);
      // --- Fin: Log de depuración ---
      const { data: lessonData, error: lessonError } = await supabase
        .from('Lesson')
        .select('classId')
        .eq('teacherId', userId);

      if (lessonError) {
        console.error("Error fetching teacher's classes:", lessonError);
        return { data: [], count: 0 };
      }

      if (!lessonData || lessonData.length === 0) {
        return { data: [], count: 0 };
      }

      const teacherClassIds = Array.from(new Set(lessonData.map(lesson => lesson.classId).filter(id => id != null)));

      if (teacherClassIds.length === 0) {
          return { data: [], count: 0 };
      }

      query = query.in('classId', teacherClassIds);

    } else if (userRole && userRole !== 'admin') {
        // --- Inicio: Log de depuración ---
        console.log(`[getStudents Debug] Applying NON-ADMIN/NON-TEACHER filter for role: ${userRole}`);
        // --- Fin: Log de depuración ---
        console.warn(`User role "${userRole}" attempted to access student list without specific permissions.`);
        return { data: [], count: 0 };
    } else {
        // --- Inicio: Log de depuración ---
        console.log(`[getStudents Debug] Applying NO role filter (likely admin or unauthenticated/unexpected role): ${userRole}`);
        // --- Fin: Log de depuración ---
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (classId) query = query.eq('classId', classId);
    if (gradeId) query = query.eq('gradeId', gradeId);
    if (parentId) query = query.eq('parentId', parentId);

    const rangeStart = (page - 1) * ITEM_PER_PAGE;
    const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
    query = query.range(rangeStart, rangeEnd).order('surname');

    const { data, error, count } = await query;

    if (error) {
        console.error("Server-side student fetch error:", error);
        return { data: [], count: 0 };
    }

    // Mapear para asegurar tipos (fechas, relaciones)
    const resultData = data.map((student: any) => ({
        ...student,
        birthday: new Date(student.birthday), // Convertir a Date
        createdAt: new Date(student.createdAt), // Convertir a Date
        Class: student.Class ?? undefined,
        Grade: student.Grade ?? undefined,
        Parent: student.Parent ?? undefined,
    }));

    return {
      data: resultData,
      count: count || 0
    };
}

export default async function StudentListPage({
  searchParams: resolvedSearchParams,
}: {
  searchParams: { // No Promise
    page?: string;
    search?: string;
    classId?: string;
    gradeId?: string; // Añadir gradeId
    parentId?: string; // Añadir parentId
    [key: string]: string | undefined;
  };
}) {
  const { userId, role } = await useUserRole();
  const queryClient = getQueryClient();

  // Parsear searchParams
  const page = parseInt(resolvedSearchParams?.page || "1", 10);
  const search = resolvedSearchParams?.search;
  const classId = resolvedSearchParams?.classId ? parseInt(resolvedSearchParams.classId, 10) : undefined;
  const gradeId = resolvedSearchParams?.gradeId ? parseInt(resolvedSearchParams.gradeId, 10) : undefined;
  const parentId = resolvedSearchParams?.parentId; // No necesita parse

  // QueryKey debe coincidir con useStudentList
  // Incluir todos los parámetros usados por el hook, incluyendo role y userId
  const queryKey = ['student', 'list', page, search, classId, gradeId, parentId, role, userId];

  // Prefetch
  await queryClient.prefetchQuery<StudentListResult>({
    queryKey: queryKey,
    queryFn: () => getStudents({ page, search, classId, gradeId, parentId, userRole: role, userId }),
  });

  // Dehydrate
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationProvider state={dehydratedState}>
      <ClientWrapper 
        initialRole={role} 
        initialUserId={userId} 
        searchParams={resolvedSearchParams} // Pasar searchParams
      />
    </HydrationProvider>
  );
}
