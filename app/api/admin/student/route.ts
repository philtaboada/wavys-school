import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario no proporcionado' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Eliminar el usuario de Auth (esto funciona en el servidor)
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      console.error('Error al eliminar usuario de Auth:', error);
      return NextResponse.json(
        { error: `Error al eliminar usuario: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en API delete-user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}