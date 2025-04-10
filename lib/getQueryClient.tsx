import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

// cache() de React asegura que solo creemos una instancia de QueryClient por petición
const getQueryClient = cache(() => new QueryClient({
    defaultOptions: {
        queries: {
            // Configuraciones globales si las necesitas
             // staleTime: 1000 * 60 * 5, // Ejemplo: 5 minutos global staleTime
             // refetchOnWindowFocus: false, // Ejemplo: Desactivar refetch globalmente
        },
    },
}));

export default getQueryClient; 