import { NextResponse } from 'next/server';
import { createPublicClient, createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createPublicClient();

  const { data, error } = await supabase.from('Students').select('*');

  if (error) {
    console.error('Error al obtener estudiantes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createPublicClient();
  const body = await request.json();

  const { data, error } = await supabase.from('Students').insert(body).select('*').single();

  if (error) {
    console.error('Error al insertar estudiante:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const supabase = await createPublicClient();
  const body = await request.json();

  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  const { data, error } = await supabase.from('Students').update(updates).eq('id', id).select('*').single();

  if (error) {
    console.error("Error al actualizar estudiante:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(request: Request) {
  const supabase = await createAdminClient();
  const { id } = await request.json();

  console.log('ID del usuario a eliminar:', id);

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  try {
    // Eliminar el usuario de supabase auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error("Error al eliminar usuario de supabase auth:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Eliminar el estudiante de la tabla Student
    const { error: deleteStudentError } = await supabase
      .from('Student')
      .delete()
      .eq('id', id);

    if (deleteStudentError) {
      console.error("Error al eliminar estudiante:", deleteStudentError);
      return NextResponse.json({ error: deleteStudentError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Estudiante eliminado correctamente' }, { status: 200 });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}


// Eliminar los registros relacionados en la tabla Result
// const { error: deleteResultsError } = await supabase.auth.admin.deleteUser(id);
// .from('Result')
// .delete()
// .eq('studentId', id);

//   if (deleteResultsError) {
//     console.error("Error al eliminar registros relacionados en Result:", deleteResultsError);
//     return NextResponse.json({ error: deleteResultsError.message }, { status: 500 });
//   }

//   // Eliminar el estudiante de la tabla Student
//   const { error: deleteStudentError } = await supabase
//     .from('Student')
//     .delete()
//     .eq('id', id);

//   if (deleteStudentError) {
//     console.error("Error al eliminar estudiante:", deleteStudentError);
//     return NextResponse.json({ error: deleteStudentError.message }, { status: 500 });
//   }

//   return NextResponse.json({ message: 'Estudiante eliminado correctamente' }, { status: 200 });
// }

// Eliminar los registros relacionados en la tabla Result
//   const { error: deleteResultsError } = await supabase.auth.admin.deleteUser(id);
//   // .from('Result')
//   // .delete()
//   // .eq('studentId', id);

//   if (deleteResultsError) {
//     console.error("Error al eliminar registros relacionados en Result:", deleteResultsError);
//     return NextResponse.json({ error: deleteResultsError.message }, { status: 500 });
//   }

//   // Eliminar el estudiante de la tabla Student
//   const { error: deleteStudentError } = await supabase
//     .from('Student')
//     .delete()
//     .eq('id', id);

//   if (deleteStudentError) {
//     console.error("Error al eliminar estudiante:", deleteStudentError);
//     return NextResponse.json({ error: deleteStudentError.message }, { status: 500 });
//   }

//   return NextResponse.json({ message: 'Estudiante eliminado correctamente' }, { status: 200 });
// }