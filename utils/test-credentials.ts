// Script para probar las credenciales de Supabase y Google Cloud Storage
import * as dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

// Función para verificar las credenciales de Supabase
async function testSupabase(): Promise<boolean> {
  console.log('🔹 PRUEBA DE SUPABASE');
  console.log('--------------------');
  
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Error: Faltan las variables de entorno de Supabase');
      return false;
    }
    
    console.log('URL de Supabase: ' + process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Clave anónima cargada: ' + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Sí' : '❌ No'));
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Intenta hacer una consulta simple
    const { data, error } = await supabase.from('Class').select('id, name').limit(1);
    
    if (error) {
      console.error('❌ Error al conectar con Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    console.log('Datos de prueba:');
    console.log(data);
    return true;
  } catch (error) {
    console.error('❌ Error en la prueba de Supabase:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Función para verificar las credenciales de Google Cloud Storage
async function testGCS(): Promise<boolean> {
  console.log('\n🔹 PRUEBA DE GOOGLE CLOUD STORAGE');
  console.log('-----------------------------');
  
  try {
    const requiredVars = [
      'GCP_PROJECT_ID',
      'GCP_BUCKET_NAME',
      'GCP_CREDENTIALS'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`❌ Error: Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`);
      return false;
    }
    
    console.log('ID del proyecto: ' + process.env.GCP_PROJECT_ID);
    console.log('Nombre del bucket: ' + process.env.GCP_BUCKET_NAME);
    console.log('Credenciales cargadas: ' + (process.env.GCP_CREDENTIALS ? '✅ Sí' : '❌ No'));
    
    // Verificar si las credenciales son un JSON válido
    let credentials;
    try {
      credentials = JSON.parse(process.env.GCP_CREDENTIALS || '');
      console.log('✅ Formato de credenciales válido');
    } catch (e) {
      console.error('❌ Error: Las credenciales no son un JSON válido');
      return false;
    }
    
    // Crear cliente de Storage
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: credentials,
    });
    
    // Verificar acceso al bucket
    const bucketName = process.env.GCP_BUCKET_NAME || '';
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    
    if (!exists) {
      console.error(`❌ Error: El bucket '${bucketName}' no existe o no tienes acceso a él`);
      return false;
    }
    
    console.log(`✅ Acceso exitoso al bucket '${bucketName}'`);
    
    // Listar algunos archivos del bucket
    const [files] = await bucket.getFiles({ maxResults: 5 });
    console.log(`Archivos en el bucket (máximo 5):`);
    if (files.length === 0) {
      console.log('  - No hay archivos en el bucket');
    } else {
      files.forEach(file => {
        console.log(`  - ${file.name}`);
      });
    }
    
    // Crear URL firmada de prueba
    const testFile = files[0] || bucket.file('archivo-de-prueba.txt');
    const [url] = await testFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
    });
    
    console.log('✅ Generación de URL firmada exitosa');
    console.log('URL firmada de prueba: ' + url);
    
    return true;
  } catch (error) {
    console.error('❌ Error en la prueba de Google Cloud Storage:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Ejecutar las pruebas
async function runTests(): Promise<void> {
  console.log('🧪 INICIO DE PRUEBAS DE CREDENCIALES');
  console.log('==================================');
  
  const supabaseResult = await testSupabase();
  const gcsResult = await testGCS();
  
  console.log('\n📋 RESUMEN DE RESULTADOS');
  console.log('====================');
  console.log('Supabase: ' + (supabaseResult ? '✅ CORRECTO' : '❌ ERROR'));
  console.log('Google Cloud Storage: ' + (gcsResult ? '✅ CORRECTO' : '❌ ERROR'));
  
  const overallResult = supabaseResult && gcsResult;
  console.log('\nResultado general: ' + (overallResult ? '✅ TODAS LAS CREDENCIALES FUNCIONAN CORRECTAMENTE' : '❌ HAY PROBLEMAS CON LAS CREDENCIALES'));
}

runTests().catch(error => {
  console.error('Error fatal en las pruebas:', error instanceof Error ? error.message : String(error));
}); 