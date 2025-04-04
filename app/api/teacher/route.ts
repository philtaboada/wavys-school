import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // Para datos JSON
    if (request.headers.get('content-type')?.includes('application/json')) {
      const data = await request.json();
      const supabase = await createClient();  // Added await here

      const { error } = await supabase
        .from('Teacher')
        .insert([data]);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Profesor creado exitosamente'
      });
    }
    // Para archivos
    else {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No se subió ningún archivo' },
          { status: 400 }
        );
      }

      // Devolver una URL temporal
      return NextResponse.json({
        url: `https://placeholder.com/${file.name}`,
        path: `/uploads/${file.name}`,
        success: true
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}