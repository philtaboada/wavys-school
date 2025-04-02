import { createAdminClient } from '@/utils/supabase/server';

export async function deleteStudentFromAuth(id: string) {
  const response = await fetch('/api/admin/students/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error al eliminar estudiante: ${error.error}`);
  }
}