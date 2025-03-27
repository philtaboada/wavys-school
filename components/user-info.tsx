'use client';

import { useUser } from '@/utils/hooks/useUser';
import { User, Profile } from '@/utils/types';
// Importamos los componentes UI desde shadcn/ui
// Nota: Asegúrate de que estos componentes estén instalados en tu proyecto
// Si no están disponibles, puedes usar alternativas o instalarlos con `npx shadcn-ui add avatar button`
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/app/actions';

/**
 * Componente que muestra información del usuario actual
 * utilizando los datos almacenados en la caché de TanStack Query.
 */
export function UserInfo() {
  const { user, profile, isAuthenticated } = useUser() as {
    user: User | null;
    profile: Profile | null;
    isAuthenticated: boolean;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="p-4 text-center">
        <p>No has iniciado sesión</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback>
            {user.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h2 className="font-medium">{user.email}</h2>
          <p className="text-sm text-muted-foreground">
            {user.user_metadata?.role || 'Usuario'}
          </p>
        </div>
      </div>

      {profile && (
        <div className="border rounded-md p-3 mt-2">
          <h3 className="font-medium">Perfil</h3>
          <p className="text-sm">ID: {profile.id}</p>
          {profile.name && <p className="text-sm">Nombre: {profile.name}</p>}
          {profile.phone && <p className="text-sm">Teléfono: {profile.phone}</p>}
        </div>
      )}

      <form action={signOutAction}>
        <Button variant="outline" className="w-full mt-2" type="submit">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
} 