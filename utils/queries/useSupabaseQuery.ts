'use client';

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Tipo para errores de Supabase
export type SupabaseError = PostgrestError | Error;

/**
 * Hook personalizado para crear consultas a Supabase con TanStack Query.
 * Este hook combina la potencia de Supabase con las capacidades de caché de TanStack Query.
 * 
 * @template TData Tipo de datos que devolverá la consulta
 * @template TResult Tipo de datos transformados (opcional)
 * @param queryKey Clave estructurada para identificar esta consulta en la caché de TanStack Query
 * @param queryFn Función que realiza la consulta a Supabase y devuelve los datos
 * @param options Opciones adicionales para configurar el comportamiento de la consulta
 */
export function useSupabaseQuery<TData, TResult = TData>(
  queryKey: QueryKey,
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<TData>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    retry?: number | boolean | ((failureCount: number, error: SupabaseError) => boolean);
    retryDelay?: number | ((retryAttempt: number) => number);
    select?: (data: TData) => TResult;
    onSuccess?: (data: TResult | TData) => void;
    onError?: (error: SupabaseError) => void;
    keepPreviousData?: boolean;
    useErrorBoundary?: boolean;
  } = {}
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const supabase = createClient();
        return await queryFn(supabase);
      } catch (error) {
        // Capturar y formatear errores de manera consistente
        console.error('Error en consulta Supabase:', error);
        throw error instanceof Error ? error : new Error(String(error));
      }
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
    onError?: (error: SupabaseError, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: SupabaseError | null, variables: TVariables) => void;
    retry?: number | boolean | ((failureCount: number, error: SupabaseError) => boolean);
    retryDelay?: number | ((retryAttempt: number) => number);
    invalidateQueries?: QueryKey | QueryKey[];
  } = {}
) {
  const queryClient = useQueryClient();
  const { invalidateQueries, ...restOptions } = options;

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        const supabase = createClient();
        return await mutationFn(supabase, variables);
      } catch (error) {
        console.error('Error en mutación Supabase:', error);
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    onSuccess: async (data, variables) => {
      if (options.onSuccess) {
        await options.onSuccess(data, variables);
      }
      
      // Invalidar consultas relacionadas si se especificaron
      if (invalidateQueries) {
        const keysToInvalidate = Array.isArray(invalidateQueries) && !Array.isArray(invalidateQueries[0]) 
          ? [invalidateQueries] 
          : invalidateQueries;
          
        if (Array.isArray(keysToInvalidate)) {
          for (const key of keysToInvalidate) {
            await queryClient.invalidateQueries({ queryKey: key });
          }
        } else {
          await queryClient.invalidateQueries({ queryKey: keysToInvalidate });
        }
      }
    },
    ...restOptions
  });
} 