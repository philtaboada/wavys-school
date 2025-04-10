'use client';

import FinanceChart from "./FinanceChart";
import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';

export default function FinanceChartTQ() {
  // Como el componente original probablemente no consulta datos de Supabase,
  // simplemente renderizamos el componente FinanceChart directamente.
  // En un caso real, podrías usar useSupabaseQuery para obtener datos financieros.
  
  // Ejemplo de cómo se vería:
  /*
  const { data, isLoading, error } = useSupabaseQuery(
    ['finances'],
    async (supabase) => {
      const { data, error } = await supabase.from('finances').select('*');
      if (error) throw new Error(error.message);
      return data;
    }
  );

  if (isLoading) {
    return <div>Cargando datos financieros...</div>;
  }

  if (error) {
    return <div>Error al cargar datos financieros: {error.message}</div>;
  }
  */

  return <FinanceChart />;
} 