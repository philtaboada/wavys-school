import { useUserRole } from "@/utils/hooks";
import ClientWrapper from "./client-wrapper";
import getQueryClient from "@/lib/getQueryClient";
import { dehydrate } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/server";
import { useAssignmentList } from "@/utils/queries/assignmentQueries";
import HydrationProvider from "@/components/providers/HydrationProvider";

async function getAssignments(params: {
  page: number;
  search?: string;
  classId?: number;
  teacherId?: string;
  userId?: string;
  role?: string;
}) {
    const supabase = await createClient();
    const { page, search, classId, teacherId, userId, role } = params;

    let filterLessonIds: number[] | null = null;

    if (classId) {
        const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).eq('classId', classId);
        filterLessonIds = lessons?.map(l => l.id) || [];
        if (filterLessonIds.length === 0) return { data: [], count: 0 };
    }
    if (teacherId) {
        const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).eq('teacherId', teacherId);
        const lessonIdsFromTeacher = lessons?.map(l => l.id) || [];
        if (filterLessonIds) {
            filterLessonIds = filterLessonIds.filter(id => lessonIdsFromTeacher.includes(id));
        } else {
            filterLessonIds = lessonIdsFromTeacher;
        }
        if (filterLessonIds.length === 0) return { data: [], count: 0 };
    }
    if (filterLessonIds === null && role && role !== 'admin' && userId) {
        if (role === 'teacher') {
            const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).eq('teacherId', userId);
            filterLessonIds = lessons?.map(l => l.id) || [];
            if (filterLessonIds.length === 0) return { data: [], count: 0 };
        } else if (role === 'student') {
            const { data: studentData } = await supabase.from('Student').select('classId').eq('id', userId).maybeSingle();
            if (studentData?.classId) {
                const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).eq('classId', studentData.classId);
                filterLessonIds = lessons?.map(l => l.id) || [];
                if (filterLessonIds.length === 0) return { data: [], count: 0 };
            } else {
                return { data: [], count: 0 };
            }
        } else if (role === 'parent') {
            const { data: parentStudents } = await supabase.from('Student').select('classId').eq('parentId', userId);
            if (parentStudents && parentStudents.length > 0) {
                const classIds = Array.from(new Set(parentStudents.map(s => s.classId).filter(id => id != null))) as number[];
                if (classIds.length > 0) {
                    const { data: lessons } = await supabase.from('Lesson').select('id', { count: 'exact' }).in('classId', classIds);
                    filterLessonIds = lessons?.map(l => l.id) || [];
                    if (filterLessonIds.length === 0) return { data: [], count: 0 };
                } else {
                    return { data: [], count: 0 };
                }
            } else {
                return { data: [], count: 0 };
            }
        }
    }

    let query = supabase
        .from('Assignment')
        .select(`
          id, title, startDate, dueDate, lessonId,
          lesson: Lesson (id, name, subject: Subject (id, name), class: Class (id, name), teacher: Teacher (id, name, surname))
        `, { count: 'exact' });

    if (search) query = query.ilike('title', `%${search}%`);
    if (filterLessonIds !== null) query = query.in('lessonId', filterLessonIds);

    const rangeStart = (page - 1) * 10;
    const rangeEnd = rangeStart + 10 - 1;
    query = query.range(rangeStart, rangeEnd).order('dueDate', { ascending: true, nullsFirst: false });

    const { data, error, count } = await query;

    if (error) {
        console.error("Server-side assignment fetch error:", error);
        return { data: [], count: 0 };
    }

    const resultData = data.map((assignment: any) => ({
        ...assignment,
        startDate: new Date(assignment.startDate),
        dueDate: new Date(assignment.dueDate),
        lesson: assignment.lesson ? {
            ...assignment.lesson,
            subject: assignment.lesson.subject ?? undefined,
            class: assignment.lesson.class ?? undefined,
            teacher: assignment.lesson.teacher ?? undefined
        } : undefined
    }));

    return { data: resultData, count: count || 0 };
}

export default async function AssignmentListPage({
  searchParams: resolvedSearchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    classId?: string;
    teacherId?: string;
    [key: string]: string | undefined;
  };
}) {
  const { userId, role } = await useUserRole();
  const queryClient = getQueryClient();

  const page = parseInt(resolvedSearchParams?.page || "1", 10);
  const search = resolvedSearchParams?.search;
  const classId = resolvedSearchParams?.classId ? parseInt(resolvedSearchParams.classId, 10) : undefined;
  const teacherId = resolvedSearchParams?.teacherId;

  const queryKey = ['assignment', 'list', page, search, classId, teacherId, role, userId];

  await queryClient.prefetchQuery({
    queryKey: queryKey,
    queryFn: () => getAssignments({ page, search, classId, teacherId, role, userId }),
  });

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
