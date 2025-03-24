import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

// Función para ocultar información sensible
function maskString(str: string, keepFirstChars: number = 4, keepLastChars: number = 4): string {
  if (!str) return 'NO DISPONIBLE';
  if (str.length <= keepFirstChars + keepLastChars) return str;
  
  const firstPart = str.substring(0, keepFirstChars);
  const lastPart = str.substring(str.length - keepLastChars);
  const maskedLength = str.length - keepFirstChars - keepLastChars;
  
  return `${firstPart}${'*'.repeat(Math.min(maskedLength, 10))}${lastPart}`;
}

// Verificar si el archivo existe
try {
  if (!fs.existsSync('.env.local')) {
    console.error('❌ El archivo .env.local no existe.');
    process.exit(1);
  }
  console.log('✅ El archivo .env.local existe.');
  
  // Leer el archivo como texto para verificar su formato
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  console.log(`\nContenido del archivo (líneas: ${envContent.split('\n').length}):`);
  
  // Verificar variables de Supabase
  console.log('\n🔹 VARIABLES DE SUPABASE:');
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL no está definida');
  }
  
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${maskString(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 5, 5)}`);
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida');
  }
  
  // Verificar variables de Google Cloud Storage
  console.log('\n🔹 VARIABLES DE GOOGLE CLOUD STORAGE:');
  if (process.env.GCP_PROJECT_ID) {
    console.log(`- GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID}`);
  } else {
    console.log('❌ GCP_PROJECT_ID no está definida');
  }
  
  if (process.env.GCP_BUCKET_NAME) {
    console.log(`- GCP_BUCKET_NAME: ${process.env.GCP_BUCKET_NAME}`);
  } else {
    console.log('❌ GCP_BUCKET_NAME no está definida');
  }
  
  // Verificar formato de las credenciales de GCP
  console.log('\n🔹 ANÁLISIS DE GCP_CREDENTIALS:');
  if (process.env.GCP_CREDENTIALS) {
    console.log(`- GCP_CREDENTIALS está definida (longitud: ${process.env.GCP_CREDENTIALS.length} caracteres)`);
    
    // Verificar que comience y termine con llaves
    const startsWith = process.env.GCP_CREDENTIALS.trim().startsWith('{');
    const endsWith = process.env.GCP_CREDENTIALS.trim().endsWith('}');
    
    console.log(`- Comienza con '{': ${startsWith ? '✅' : '❌'}`);
    console.log(`- Termina con '}': ${endsWith ? '✅' : '❌'}`);
    
    // Intentar parsear como JSON
    try {
      const credentials = JSON.parse(process.env.GCP_CREDENTIALS);
      console.log('- JSON válido: ✅');
      
      // Verificar campos esenciales
      const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !credentials[field]);
      
      if (missingFields.length === 0) {
        console.log('- Campos requeridos: ✅ Todos presentes');
        console.log(`- Tipo de cuenta: ${credentials.type}`);
        console.log(`- ID de proyecto: ${credentials.project_id}`);
        console.log(`- Correo del cliente: ${credentials.client_email}`);
      } else {
        console.log(`- Campos requeridos: ❌ Faltan: ${missingFields.join(', ')}`);
      }
    } catch (e) {
      console.log('- JSON válido: ❌ Error al parsear');
      console.log(`- Error: ${e instanceof Error ? e.message : String(e)}`);
      
      // Mostrar fragmentos de las credenciales para identificar el problema
      const credentials = process.env.GCP_CREDENTIALS;
      console.log('\nRevisión de formato:');
      console.log(`- Primeros 30 caracteres: ${credentials.substring(0, 30)}...`);
      console.log(`- Últimos 30 caracteres: ...${credentials.substring(credentials.length - 30)}`);
    }
  } else {
    console.log('❌ GCP_CREDENTIALS no está definida');
  }
  
  console.log('\n📋 CONSEJOS PARA SOLUCIONAR PROBLEMAS:');
  console.log('1. Asegúrate de que las credenciales de GCP sean un JSON válido y completo.');
  console.log('2. Verifica que no haya espacios adicionales o saltos de línea en las credenciales.');
  console.log('3. Asegúrate de que la tabla "class" exista en Supabase y tenga los permisos correctos.');
  console.log('4. Si usas VSCode, instala la extensión "DotENV" para formatear correctamente el archivo .env.local.');
  
} catch (error) {
  console.error('Error al leer el archivo .env.local:', error instanceof Error ? error.message : String(error));
} 