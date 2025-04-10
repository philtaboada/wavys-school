'use client';

import { HydrationBoundary, HydrationBoundaryProps } from '@tanstack/react-query';

/**
 * Componente Cliente que maneja la hidratación de la caché de TanStack Query.
 * Recibe el estado deshidratado del servidor y lo usa para inicializar la caché en el cliente.
 */
function HydrationProvider({ children, state }: HydrationBoundaryProps) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}

export default HydrationProvider; 