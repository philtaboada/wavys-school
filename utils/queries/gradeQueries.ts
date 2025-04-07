import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

// Definir tipos
interface Grade {
  id: number;
  name?: string;
  level: string;
}

interface GradeListResult {
  data: Grade[];
  count: number;
}

// Hook para obtener la lista de grados
export function useGradeList() {
  return useQuery<GradeListResult, Error>({
    queryKey: ['grades'],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error, count } = await supabase
        .from('Grade')
        .select('id, level')
        .order('level');

      if (error) {
        console.error("Error fetching grades:", error);
        throw new Error(error.message);
      }

      // Agregar log para verificar la estructura de los datos
      console.log("Datos de grados obtenidos:", data);

      // Transformar los datos para que coincidan con la interfaz Grade
      const formattedData = data?.map(grade => ({
        id: grade.id,
        level: grade.level,
        // Opcionalmente podemos agregar un nombre basado en el nivel
        name: `Grado ${grade.level}`
      })) || [];

      return {
        data: formattedData,
        count: count || 0
      };
    }
  });
}

// Hook para obtener un grado específico por ID
export function useGrade(id: number) {
  return useQuery<Grade, Error>({
    queryKey: ['grade', id],
    queryFn: async () => {
      if (!id) throw new Error('ID de grado no proporcionado');

      const supabase = createClient();

      const { data, error } = await supabase
        .from('Grade')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching grade with ID ${id}:`, error);
        throw new Error(error.message);
      }

      return {
        id: data.id,
        level: data.level,
        name: data.name || `Grado ${data.level}`
      };
    },
    enabled: !!id
  });
}