'use client';

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

/**
 * Hook personalizado para crear consultas a Supabase con TanStack Query.
 * Este hook combina la potencia de Supabase con las capacidades de caché de TanStack Query.
 * 
 * @template TData Tipo de datos que devolverá la consulta
 * @param queryKey Clave única para identificar esta consulta en la caché de TanStack Query
 * @param queryFn Función que realiza la consulta a Supabase y devuelve los datos
 * @param options Opciones adicionales para configurar el comportamiento de la consulta
 */
export function useSupabaseQuery<TData>(
  queryKey: QueryKey,
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<TData>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const supabase = createClient();
      return queryFn(supabase);
    },
    ...options
  });
}

/**
 * Hook personalizado para crear mutaciones en Supabase con TanStack Query.
 * Este hook facilita operaciones de escritura como insertar, actualizar o eliminar datos.
 * 
 * @template TVariables Tipo de variables que acepta la mutación
 * @template TData Tipo de datos que devolverá la mutación
 * @param mutationFn Función que realiza la operación de escritura en Supabase
 * @param options Opciones adicionales para configurar el comportamiento de la mutación
 */
export function useSupabaseMutation<TVariables, TData>(
  mutationFn: (supabase: ReturnType<typeof createClient>, variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void | Promise<unknown>;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
    invalidateQueries?: QueryKey[];
  } = {}
) {
  const queryClient = useQueryClient();
  const { invalidateQueries, ...restOptions } = options;

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const supabase = createClient();
      return mutationFn(supabase, variables);
    },
    onSuccess: async (data, variables) => {
      if (options.onSuccess) {
        await options.onSuccess(data, variables);
      }
      
      // Invalidar consultas relacionadas si se especificaron
      if (invalidateQueries && invalidateQueries.length > 0) {
        for (const key of invalidateQueries) {
          await queryClient.invalidateQueries({ queryKey: key });
        }
      }
    },
    ...restOptions
  });
} 