import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/server';

// Configurar cliente de Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_CREDENTIALS || '{}'),
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME || '');

// Tiempo de expiración de la URL firmada en minutos (7 días)
const URL_EXPIRATION_TIME = 60 * 24 * 7;

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación del usuario
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    // Procesar el archivo
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' }, 
        { status: 400 }
      );
    }

    // Validar el tipo de archivo (solo imágenes)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' }, 
        { status: 400 }
      );
    }

    // Leer el archivo como un array buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Generar un nombre único para el archivo
    const fileName = `${uuidv4()}-${file.name.replace(/\s/g, '_')}`;
    const filePath = `profile-images/${fileName}`;
    
    // Crear un archivo en el bucket y cargar el buffer
    const gcsFile = bucket.file(filePath);
    
    // Configurar opciones para la carga
    const stream = gcsFile.createWriteStream({
      metadata: {
        contentType: file.type,
      },
      resumable: false,
    });

    // Promisificar stream.on('finish')
    const uploadPromise = new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Escribir el buffer al stream
    stream.end(Buffer.from(fileBuffer));
    
    // Esperar a que se complete la carga
    await uploadPromise;

    // En lugar de hacer público el archivo, generar una URL firmada
    const [url] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * URL_EXPIRATION_TIME, // URL válida por 7 días
    });

    // Guardar también la ruta del archivo para referencias futuras
    // Podríamos almacenarla en Supabase para seguimiento
    const fileInfo = {
      url,
      path: filePath,
      bucket: process.env.GCP_BUCKET_NAME,
      filename: fileName,
      contentType: file.type,
      userId: session.user.id,
      uploadedAt: new Date().toISOString(),
    };

    // Opcionalmente, podríamos guardar estos metadatos en Supabase
    // const { error } = await supabase
    //   .from('file_uploads')
    //   .insert(fileInfo);

    return NextResponse.json({ 
      url, 
      path: filePath,
      expiresAt: new Date(Date.now() + 1000 * 60 * URL_EXPIRATION_TIME).toISOString() 
    });
  } catch (error) {
    console.error('Error al cargar el archivo:', error);
    return NextResponse.json(
      { error: 'Error al cargar el archivo' }, 
      { status: 500 }
    );
  }
} 