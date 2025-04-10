'use client';

import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';

interface Event {
  id: number;
  title: string;
  description: string;
  startTime: string;
}

interface EventListTQProps {
  dateParam: string | undefined;
}

export default function EventListTQ({ dateParam }: EventListTQProps) {
  const date = dateParam ? new Date(dateParam) : new Date();

  // Obtener eventos usando TanStack Query
  const { data: events, isLoading, error } = useSupabaseQuery<Event[]>(
    ['events', dateParam],
    async (supabase) => {
      // Crear fechas separadas para el inicio y fin del día para evitar mutaciones
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Consulta eventos con Supabase
      const { data, error } = await supabase
        .from('Event')
        .select('*')
        .gte('startTime', startOfDay.toISOString())
        .lte('startTime', endOfDay.toISOString());
      
      if (error) {
        throw new Error(`Error al obtener eventos: ${error.message}`);
      }
      
      return data as Event[];
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="p-5 rounded-md border-2 border-gray-100 border-t-4 border-t-gray-200 mb-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
        <div className="p-5 rounded-md border-2 border-gray-100 border-t-4 border-t-gray-200">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje de error
  if (error) {
    return <div className="text-red-500">Error al cargar eventos</div>;
  }

  // Mostrar mensaje si no hay eventos
  if (!events || events.length === 0) {
    return <div className="text-gray-500">No hay eventos para mostrar.</div>;
  }

  // Mostrar la lista de eventos
  return (
    <>
      {events.map((event) => (
        <div
          className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
          key={event.id}
        >
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-gray-600">{event.title}</h1>
            <span className="text-gray-300 text-xs">
              {new Date(event.startTime).toLocaleTimeString("en-UK", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
          <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
        </div>
      ))}
    </>
  );
} 