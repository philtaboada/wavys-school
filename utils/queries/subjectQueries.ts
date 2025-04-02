'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';
import { Subject, SubjectListParams, SubjectListResult, CreateSubjectParams, UpdateSubjectParams } from '@/utils/types/subject';
import { createClient } from '@/utils/supabase/client'; // Importar para filtros

/**
 * Hook para obtener la lista de asignaturas con filtrado y paginación optimizado
 */
export function useSubjectList(params: SubjectListParams & { userRole?: string; userId?: string }) {
  const { page, search, teacherId, userRole, userId } = params;

  return useSupabaseQuery<SubjectListResult>(
    ['subject', 'list', page, search, teacherId, userRole, userId],
    async (supabase) => {

      let subjectIdsFromFilter: number[] | null = null;

      // **Manejo de filtros dependientes (antes de construir la query principal)**
      if (teacherId) {
        // Filtro explícito por profesor
        const { data: teacherSubjects } = await supabase
          .from('subject_teacher')
          .select('subjectId')
          .eq('teacherId', teacherId);
        subjectIdsFromFilter = teacherSubjects?.map(ts => ts.subjectId) || [];
        if (subjectIdsFromFilter.length === 0) return { data: [], count: 0 };
      } else if (userRole && userRole !== 'admin' && userId) {
        // Filtros basados en el rol del usuario logueado
        if (userRole === 'teacher') {
          const { data: teacherSubjects } = await supabase
            .from('subject_teacher')
            .select('subjectId')
            .eq('teacherId', userId);
          subjectIdsFromFilter = teacherSubjects?.map(ts => ts.subjectId) || [];
          if (subjectIdsFromFilter.length === 0) return { data: [], count: 0 };
        } else if (userRole === 'student') {
          const { data: studentData } = await supabase.from('Student').select('classId').eq('id', userId).single();
          if (studentData?.classId) {
            const { data: classSubjects } = await supabase.from('ClassSubject').select('subjectId').eq('classId', studentData.classId);
            subjectIdsFromFilter = classSubjects?.map(cs => cs.subjectId) || [];
            if (subjectIdsFromFilter.length === 0) return { data: [], count: 0 };
          } else {
            return { data: [], count: 0 };
          }
        } else if (userRole === 'parent') {
          const { data: parentStudents } = await supabase.from('Student').select('classId').eq('parentId', userId);
          if (parentStudents && parentStudents.length > 0) {
            const classIds = Array.from(new Set(parentStudents.map(s => s.classId).filter(id => id != null))) as number[];
            if (classIds.length > 0) {
              const { data: classSubjects } = await supabase.from('ClassSubject').select('subjectId').in('classId', classIds);
              subjectIdsFromFilter = classSubjects?.map(cs => cs.subjectId) || [];
              if (subjectIdsFromFilter.length === 0) return { data: [], count: 0 };
            } else {
                 return { data: [], count: 0 };
            }
          } else {
            return { data: [], count: 0 };
          }
        }
      }

      // Construir la consulta base con profesores relacionados
      let query = supabase
        .from('Subject')
        .select(`
          id,
          name,
          teachers:subject_teacher!inner (
             teacher: Teacher!inner ( id, name, surname )
          )
        `, { count: 'exact' }); // count 'exact' en la tabla principal

      // Aplicar filtros de búsqueda
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Aplicar filtro por IDs específicos (obtenidos antes)
      if (subjectIdsFromFilter !== null) {
        query = query.in('id', subjectIdsFromFilter);
      }
      
      // Si se filtra por teacherId explícito, asegurar que el join lo incluya
      // (Aunque el filtro .in('id', ...) ya debería cubrirlo si la lógica anterior es correcta)
      // Alternativa: query = query.eq('teachers.teacher.id', teacherId); pero puede ser menos eficiente

      // Paginación y orden
      const rangeStart = (page - 1) * ITEM_PER_PAGE;
      const rangeEnd = rangeStart + ITEM_PER_PAGE - 1;
      query = query.range(rangeStart, rangeEnd).order('name');

      // Ejecutar la consulta única
      // Tipo intermedio para manejar la estructura anidada devuelta por Supabase
       type SubjectWithNestedTeachers = Omit<Subject, 'teachers'> & {
           teachers: { teacher: { id: string; name: string; surname: string } }[];
       };
      const { data, error, count } = await query.returns<SubjectWithNestedTeachers[]>();

      if (error) {
        console.error("Error fetching subjects:", error);
        throw new Error(`Error al obtener datos de asignaturas: ${error.message}`);
      }

      // Mapear los resultados para aplanar la estructura de profesores
      const result: Subject[] = data.map(subject => ({
        id: subject.id,
        name: subject.name,
        // Usar Set para evitar duplicados si un profesor está múltiples veces (aunque no debería ocurrir con !inner)
        teachers: Array.from(new Map(subject.teachers.map(t => [t.teacher.id, t.teacher])).values()) 
      }));

      return {
        data: result,
        count: count || 0
      };
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
}

/**
 * Función para crear una nueva asignatura (optimizada con RPC)
 */
export function useCreateSubject() {
  return useSupabaseMutation<CreateSubjectParams, { id: number }>(
    async (supabase, params) => {
      const { name, teachers } = params;

      // **Optimización: Usar RPC para crear asignatura y relaciones en una transacción**
      /*
      CREATE OR REPLACE FUNCTION create_subject_with_teachers(subject_name text, teacher_ids uuid[])
      RETURNS int -- Devuelve el ID de la nueva asignatura
      LANGUAGE plpgsql
      AS $$
      DECLARE
        new_subject_id int;
      BEGIN
        -- Insertar la asignatura
        INSERT INTO public."Subject" (name) VALUES (subject_name) RETURNING id INTO new_subject_id;

        -- Insertar relaciones si hay IDs de profesores
        IF array_length(teacher_ids, 1) > 0 THEN
          INSERT INTO public.subject_teacher ("subjectId", "teacherId")
          SELECT new_subject_id, unnest(teacher_ids);
        END IF;

        RETURN new_subject_id;
      END;
      $$;
      */

      const { data, error } = await supabase.rpc('create_subject_with_teachers', {
          subject_name: name,
          teacher_ids: teachers || []
      });

      if (error) {
        console.error("Error creating subject via RPC:", error);
        throw new Error(`Error al crear asignatura: ${error.message}`);
      }

      // El RPC devuelve el ID directamente
      return { id: data as number };

      // Código Original (menos seguro)
      /*
      const { data, error } = await supabase
        .from('Subject')
        .insert({ name })
        .select('id')
        .single();
      
      if (error) {
        console.error("Error inserting subject:", error);
        throw new Error(`Error al crear asignatura: ${error.message}`);
      }
      
      if (teachers && teachers.length > 0 && data.id) {
        const teacherSubjects = teachers.map(teacherId => ({ teacherId, subjectId: data.id }));
        const { error: relationError } = await supabase.from('subject_teacher').insert(teacherSubjects);
        if (relationError) {
            // Intentar borrar la asignatura creada si falla la relación?
            console.error("Error inserting subject_teacher relations:", relationError);
            throw new Error(`Error al asignar profesores: ${relationError.message}`);
        }
      }
      return data as { id: number };
      */
    },
    {
      invalidateQueries: [['subject', 'list']],
      onError: (error) => {
        console.error("Mutation error (Create Subject):", error);
      }
    }
  );
}

/**
 * Función para actualizar una asignatura existente (optimizada con RPC)
 */
export function useUpdateSubject() {
  return useSupabaseMutation<UpdateSubjectParams, { id: number }>(
    async (supabase, params) => {
      const { id, name, teachers } = params;

      // **Optimización: Usar RPC para actualizar nombre y sincronizar relaciones**
      /*
      CREATE OR REPLACE FUNCTION update_subject_with_teachers(subject_id_to_update int, new_subject_name text, new_teacher_ids uuid[])
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- Actualizar nombre
        UPDATE public."Subject" SET name = new_subject_name WHERE id = subject_id_to_update;

        -- Sincronizar relaciones (eliminar las que no están, añadir las nuevas)
        -- 1. Eliminar relaciones que ya no deben existir
        DELETE FROM public.subject_teacher st
        WHERE st."subjectId" = subject_id_to_update
          AND st."teacherId" <> ALL(new_teacher_ids);

        -- 2. Insertar nuevas relaciones (ignorando conflictos si ya existen)
        INSERT INTO public.subject_teacher ("subjectId", "teacherId")
        SELECT subject_id_to_update, teacher_id
        FROM unnest(new_teacher_ids) AS teacher_id
        ON CONFLICT ("subjectId", "teacherId") DO NOTHING;

      END;
      $$;
      */
      
      // teachers puede ser undefined si no se modifican en el form
      // Si es undefined, podemos no pasarlo al RPC o pasar null/array vacío según defina el RPC
      // Aquí asumimos que si es undefined, no se deben tocar las relaciones existentes.
      // Si teachers es un array (incluso vacío), sí se deben sincronizar.
      if (teachers !== undefined) {
           const { error } = await supabase.rpc('update_subject_with_teachers', {
              subject_id_to_update: id,
              new_subject_name: name,
              new_teacher_ids: teachers || []
           });
           if (error) {
              console.error("Error updating subject via RPC:", error);
              throw new Error(`Error al actualizar asignatura: ${error.message}`);
           }
      } else {
           // Si teachers es undefined, solo actualizar el nombre
            const { error } = await supabase
              .from('Subject')
              .update({ name })
              .eq('id', id)
              .select('id')
              .single();
             if (error) {
                 console.error("Error updating subject name only:", error);
                 throw new Error(`Error al actualizar nombre de asignatura: ${error.message}`);
            }
      }

      return { id }; // Devolver el ID como confirmación

      // Código Original (menos seguro)
      /*
      const { data, error } = await supabase
        .from('Subject')
        .update({ name })
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
         console.error("Error updating subject name:", error);
         throw new Error(`Error al actualizar asignatura: ${error.message}`);
      }
      
      if (teachers !== undefined) {
        const { error: deleteError } = await supabase.from('subject_teacher').delete().eq('subjectId', id);
        if (deleteError) {
           console.error("Error deleting old subject_teacher relations:", deleteError);
           throw new Error(`Error al eliminar relaciones antiguas: ${deleteError.message}`);
        }
        if (teachers.length > 0) {
          const teacherSubjects = teachers.map(teacherId => ({ teacherId, subjectId: id }));
          const { error: insertError } = await supabase.from('subject_teacher').insert(teacherSubjects);
          if (insertError) {
             console.error("Error inserting new subject_teacher relations:", insertError);
             throw new Error(`Error al asignar nuevos profesores: ${insertError.message}`);
          }
        }
      }
      return data as { id: number };
      */
    },
    {
      invalidateQueries: [['subject', 'list']],
      onError: (error) => {
         console.error("Mutation error (Update Subject):", error);
      }
    }
  );
}

/**
 * Función para eliminar una asignatura (optimizada con RPC)
 */
export function useDeleteSubject() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {

       // **Optimización: Usar RPC para eliminar relaciones y asignatura en transacción**
       /*
       CREATE OR REPLACE FUNCTION delete_subject_and_relations(subject_id_to_delete int)
       RETURNS void
       LANGUAGE plpgsql
       AS $$
       BEGIN
         -- Verificar si hay Lecciones o Examenes/Tareas asociadas (opcional, pero recomendado)
         IF EXISTS (SELECT 1 FROM public."Lesson" WHERE "subjectId" = subject_id_to_delete) THEN
           RAISE EXCEPTION 'SUBJECT_HAS_LESSONS';
         END IF;
         -- Puedes añadir más verificaciones si es necesario (ej. exámenes directamente ligados)

         -- Eliminar relaciones profesor-asignatura
         DELETE FROM public.subject_teacher WHERE "subjectId" = subject_id_to_delete;
         -- Eliminar relaciones clase-asignatura
         DELETE FROM public."ClassSubject" WHERE "subjectId" = subject_id_to_delete;
         -- Eliminar la asignatura
         DELETE FROM public."Subject" WHERE id = subject_id_to_delete;
       END;
       $$;
       */
       const { error } = await supabase.rpc('delete_subject_and_relations', { subject_id_to_delete: id });

        if (error) {
            if (error.message.includes('SUBJECT_HAS_LESSONS')) {
               throw new Error('SUBJECT_HAS_LESSONS'); // Error específico
            }
            console.error("Error deleting subject via RPC:", error);
            throw new Error(`Error al eliminar asignatura: ${error.message}`);
        }

      // Código Original (menos seguro)
      /*
      const { error: relationError } = await supabase.from('subject_teacher').delete().eq('subjectId', id);
      if (relationError) {
         console.error("Error deleting subject_teacher relations:", relationError);
         throw new Error(`Error al eliminar relaciones de profesores: ${relationError.message}`);
      }
      const { error: classRelationError } = await supabase.from('ClassSubject').delete().eq('subjectId', id);
      if (classRelationError) {
         console.error("Error deleting ClassSubject relations:", classRelationError);
         throw new Error(`Error al eliminar relaciones de clases: ${classRelationError.message}`);
      }
      const { error } = await supabase.from('Subject').delete().eq('id', id);
      if (error) {
         console.error("Error deleting subject record:", error);
         throw new Error(`Error al eliminar asignatura: ${error.message}`);
      }
      */
    },
    {
      invalidateQueries: [['subject', 'list']],
      onError: (error) => {
         console.error("Mutation error (Delete Subject):", error);
      }
    }
  );
}