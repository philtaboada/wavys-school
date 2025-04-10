# TanStack Query con Supabase

Este directorio contiene hooks personalizados para integrar TanStack Query (anteriormente React Query) con Supabase en la aplicación Wavys College.

## Estructura de archivos

- `useSupabaseQuery.ts`: Hooks base para consultas y mutaciones con Supabase
- `attendanceQueries.ts`: Hooks específicos para gestionar datos de asistencia
- Otros archivos de consultas específicas (agregar según necesidad)

## Uso básico

### Consultas (Queries)

Para crear consultas a Supabase que se beneficien del caché y la revalidación de TanStack Query:

```tsx
import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';

// Definir tipo de retorno para type safety
type UserData = {
  id: string;
  name: string;
  email: string;
};

function useUsers() {
  return useSupabaseQuery<UserData[]>(
    // Clave de consulta - usada para identificar y cachear los resultados
    ['users', 'list'],
    // Función que ejecuta la consulta Supabase
    async (supabase) => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      return data as UserData[];
    },
    // Opciones de React Query (opcionales)
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
}
```

### Mutaciones

Para operaciones de escritura (insertar, actualizar, eliminar):

```tsx
import { useSupabaseMutation } from '@/utils/queries/useSupabaseQuery';

// Define los tipos para los parámetros y el resultado
type CreateUserParams = {
  name: string;
  email: string;
};

function useCreateUser() {
  return useSupabaseMutation<CreateUserParams, { id: string }>(
    // Función que ejecuta la mutación
    async (supabase, params) => {
      const { data, error } = await supabase
        .from('users')
        .insert(params)
        .select('id')
        .single();
      
      if (error) throw error;
      return data;
    },
    // Opciones
    {
      // Invalida automáticamente las consultas relacionadas
      invalidateQueries: [['users', 'list']],
      // Función a ejecutar en caso de éxito
      onSuccess: (data) => {
        console.log(`Usuario creado con ID: ${data.id}`);
      }
    }
  );
}
```

## Uso en componentes

```tsx
function UserList() {
  // Usar la consulta
  const { data, isLoading, error } = useUsers();
  
  // Usar la mutación
  const createUser = useCreateUser();
  
  const handleCreateUser = () => {
    createUser.mutate({
      name: 'Nuevo Usuario',
      email: 'usuario@ejemplo.com'
    });
  };
  
  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <button onClick={handleCreateUser}>Crear Usuario</button>
      <ul>
        {data?.map(user => (
          <li key={user.id}>{user.name} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Ejemplo completo

Ver el ejemplo de implementación en:
- `app/examples/attendance/client.tsx` - Componente de ejemplo
- `utils/queries/attendanceQueries.ts` - Hooks de consulta

## Ventajas de este enfoque

1. **Gestión de caché automática**: TanStack Query guarda los resultados en caché para mejorar el rendimiento.
2. **Revalidación inteligente**: Refresca los datos automáticamente según las políticas configuradas.
3. **Gestión de estado**: Proporciona estados como `isLoading`, `isError`, `isSuccess`, etc.
4. **Invalidación de caché**: Actualiza los datos relacionados después de mutaciones.
5. **Paginación y filtrado**: Facilita la implementación de estas funcionalidades.
6. **Desduplicación de solicitudes**: Evita solicitudes duplicadas simultáneas.
7. **Reintento automático**: Reintenta automáticamente las solicitudes fallidas.

## Recursos

- [Documentación de TanStack Query](https://tanstack.com/query/latest/docs/react/overview)
- [Documentación de Supabase](https://supabase.com/docs) 