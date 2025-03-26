'use client';

import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { ITEM_PER_PAGE } from '@/lib/settings';

// Tipos para modelos relacionados
export type Student = {
  id: string;
  name: string;
  surname: string;
};

export type Parent = {
  id: string;
  name: string;
  surname: string;
};

// Tipo de datos principal
export type Payment = {
  id: number;
  amount: number;
  date: Date;
  concept: string;
  status: string; // pending, paid, overdue
  studentId: string;
  student?: Student;
};

// Tipos para la visualización en la interfaz
export type PaymentDisplay = {
  id: number;
  amount: number;
  date: Date;
  concept: string;
  status: string;
  studentName: string;
  studentSurname: string;
  parentName: string;
  parentSurname: string;
};

// Tipos para los parámetros y resultados
export type PaymentListParams = {
  page: number;
  search?: string;
  studentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export type PaymentListResult = {
  data: PaymentDisplay[];
  count: number;
};

export type CreatePaymentParams = {
  amount: number;
  date: Date;
  concept: string;
  status: string;
  studentId: string;
};

export type UpdatePaymentParams = {
  id: number;
  amount?: number;
  date?: Date;
  concept?: string;
  status?: string;
};

/**
 * Hook para obtener la lista de pagos con filtrado y paginación
 */
export function usePaymentList(params: PaymentListParams & { userRole?: string; userId?: string }) {
  const { page, search, studentId, status, startDate, endDate, userRole, userId } = params;
  
  return useSupabaseQuery<PaymentListResult>(
    ['payment', 'list', page, search, studentId, status, startDate, endDate, userRole, userId],
    async (supabase) => {
      // Construir la consulta base
      let query = supabase
        .from('Payment')
        .select('*', { count: 'exact' });

      // Aplicar filtros específicos
      if (studentId) {
        query = query.eq('studentId', studentId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      // Filtros basados en roles
      if (userRole === "parent" && userId) {
        // Obtener los estudiantes asignados al padre
        const { data: parentStudents, error: parentStudentsError } = await supabase
          .from('Student')
          .select('id')
          .eq('parentId', userId);
        
        if (parentStudentsError) {
          throw new Error(`Error al obtener estudiantes del padre: ${parentStudentsError.message}`);
        }
        
        if (parentStudents && parentStudents.length > 0) {
          const childIds = parentStudents.map(student => student.id);
          query = query.in('studentId', childIds);
        } else {
          // Si no hay estudiantes asignados, no mostrar pagos
          return { data: [], count: 0 };
        }
      } else if (userRole === "student" && userId) {
        // Los estudiantes solo ven sus propios pagos
        query = query.eq('studentId', userId);
      }

      // Ejecutar la consulta principal
      const { data: paymentsData, error: paymentsError, count } = await query;

      if (paymentsError) {
        throw new Error(`Error al obtener datos de pagos: ${paymentsError.message}`);
      }

      // Si no hay pagos, retornar temprano
      if (!paymentsData || paymentsData.length === 0) {
        return { data: [], count: 0 };
      }

      // Mapear IDs para consultas adicionales
      const studentIds = paymentsData
        .map(payment => payment.studentId)
        .filter((id, index, self) => self.indexOf(id) === index);
      
      // Cargar datos de estudiantes
      const studentMap = new Map<string, Student>();
      const parentIds: string[] = [];
      if (studentIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from('Student')
          .select('id, name, surname, parentId')
          .in('id', studentIds);
        
        if (studentsError) {
          throw new Error(`Error al obtener datos de estudiantes: ${studentsError.message}`);
        }
        
        if (studentsData) {
          studentsData.forEach(student => {
            studentMap.set(student.id, { 
              id: student.id, 
              name: student.name, 
              surname: student.surname 
            });
            if (student.parentId) parentIds.push(student.parentId);
          });
        }
      }
      
      // Cargar datos de padres
      const parentMap = new Map<string, Parent>();
      if (parentIds.length > 0) {
        const { data: parentsData, error: parentsError } = await supabase
          .from('Parent')
          .select('id, name, surname')
          .in('id', parentIds);
        
        if (parentsError) {
          throw new Error(`Error al obtener datos de padres: ${parentsError.message}`);
        }
        
        if (parentsData) {
          parentsData.forEach(parent => {
            parentMap.set(parent.id, { 
              id: parent.id, 
              name: parent.name, 
              surname: parent.surname 
            });
          });
        }
      }

      // Filtrado por texto de búsqueda
      let filteredPayments = [...paymentsData];
      if (search && search.length > 0) {
        const searchLower = search.toLowerCase();
        filteredPayments = filteredPayments.filter(payment => {
          // Buscar en concepto
          if (payment.concept && payment.concept.toLowerCase().includes(searchLower)) return true;
          
          // Buscar en nombre de estudiante
          if (studentMap.has(payment.studentId)) {
            const student = studentMap.get(payment.studentId);
            if (
              student?.name?.toLowerCase().includes(searchLower) ||
              student?.surname?.toLowerCase().includes(searchLower)
            ) {
              return true;
            }
          }
          
          return false;
        });
      }
      
      // Obtener la cantidad total de pagos filtrados
      const totalCount = filteredPayments.length;
      
      // Aplicar paginación
      const paginatedPayments = filteredPayments.slice(
        (page - 1) * ITEM_PER_PAGE, 
        page * ITEM_PER_PAGE
      );
      
      // Crear objetos para mostrar
      const displayPayments = await Promise.all(paginatedPayments.map(async payment => {
        const student = studentMap.get(payment.studentId) || { name: 'Desconocido', surname: '' };
        
        // Obtener el parent del estudiante
        let parentName = 'Desconocido';
        let parentSurname = '';
        
        const { data: studentData } = await supabase
          .from('Student')
          .select('parentId')
          .eq('id', payment.studentId)
          .single();
        
        if (studentData && studentData.parentId && parentMap.has(studentData.parentId)) {
          const parent = parentMap.get(studentData.parentId);
          parentName = parent?.name || 'Desconocido';
          parentSurname = parent?.surname || '';
        }
        
        return {
          id: payment.id,
          amount: payment.amount,
          date: payment.date,
          concept: payment.concept,
          status: payment.status,
          studentName: student.name,
          studentSurname: student.surname,
          parentName,
          parentSurname
        };
      }));

      return { 
        data: displayPayments, 
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
 * Función para crear un nuevo pago
 */
export function useCreatePayment() {
  return useSupabaseMutation<CreatePaymentParams, { id: number }>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('Payment')
        .insert({
          amount: params.amount,
          date: params.date,
          concept: params.concept,
          status: params.status,
          studentId: params.studentId
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al crear pago: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['payment', 'list']],
      onSuccess: () => {
        console.log('Pago creado exitosamente');
      }
    }
  );
}

/**
 * Función para actualizar un pago existente
 */
export function useUpdatePayment() {
  return useSupabaseMutation<UpdatePaymentParams, { id: number }>(
    async (supabase, params) => {
      const { id, ...updateData } = params;
      
      const { data, error } = await supabase
        .from('Payment')
        .update(updateData)
        .eq('id', id)
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Error al actualizar pago: ${error.message}`);
      }
      
      return data as { id: number };
    },
    {
      invalidateQueries: [['payment', 'list']],
      onSuccess: () => {
        console.log('Pago actualizado exitosamente');
      }
    }
  );
}

/**
 * Función para eliminar un pago
 */
export function useDeletePayment() {
  return useSupabaseMutation<{ id: number }, void>(
    async (supabase, { id }) => {
      const { error } = await supabase
        .from('Payment')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error al eliminar pago: ${error.message}`);
      }
    },
    {
      invalidateQueries: [['payment', 'list']],
      onSuccess: () => {
        console.log('Pago eliminado exitosamente');
      }
    }
  );
} 