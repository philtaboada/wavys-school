# Configuración de Google Cloud Storage

Este documento describe los pasos necesarios para configurar Google Cloud Storage (GCS) para el almacenamiento de imágenes en la aplicación, basado en la configuración actual del bucket "alfred-nobel".

## Configuración actual del bucket

El bucket "alfred-nobel" tiene la siguiente configuración:
- **Ubicación**: us-west1 (Oregon)
- **Clase de almacenamiento**: Standard
- **Acceso público**: No público (Public access prevention habilitada)
- **Protección**: Soft Delete (7 días)
- **Control de acceso**: Uniforme
- **Versionado de objetos**: Desactivado

## Pasos para la configuración

### 1. Crear un bucket de almacenamiento (Si ya tienes creado el bucket "alfred-nobel", puedes omitir este paso)

1. Ve a la [Consola de Google Cloud](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. En el menú de navegación, ve a **Cloud Storage** > **Buckets**
4. Haz clic en **CREAR**
5. Asigna un nombre globalmente único a tu bucket (ej. `alfred-nobel`)
6. Selecciona una región (ej. us-west1 Oregon)
7. En la sección **Control de acceso**, selecciona **Uniforme**
8. Mantén la **Prevención de acceso público** habilitada (esta es la configuración que tienes actualmente)
9. Configura **Soft Delete** por 7 días si lo deseas
10. Haz clic en **CREAR**

### 2. Crear una cuenta de servicio

1. En el menú de navegación, ve a **IAM y administración** > **Cuentas de servicio**
2. Haz clic en **CREAR CUENTA DE SERVICIO**
3. Asigna un nombre a la cuenta de servicio (ej. `wavys-storage-admin`)
4. Opcionalmente, agrega una descripción
5. Haz clic en **CREAR Y CONTINUAR**
6. Asigna el rol **Cloud Storage** > **Storage Admin** a la cuenta de servicio
7. Haz clic en **CONTINUAR** y luego en **LISTO**

### 3. Crear una clave para la cuenta de servicio

1. En la lista de cuentas de servicio, haz clic en la cuenta de servicio que creaste
2. Ve a la pestaña **CLAVES**
3. Haz clic en **AGREGAR CLAVE** > **Crear nueva clave**
4. Selecciona **JSON** como tipo de clave
5. Haz clic en **CREAR**
   - Se descargará un archivo JSON con las credenciales de la cuenta de servicio

### 4. Configurar las variables de entorno

1. Abre el archivo JSON de credenciales descargado
2. Copia todo el contenido del archivo JSON
3. En tu archivo `.env.local`, agrega las siguientes variables:

```
GCP_PROJECT_ID=tu-id-de-proyecto
GCP_BUCKET_NAME=alfred-nobel
GCP_CREDENTIALS={"contenido":... "del": "archivo JSON"}
```

Asegúrate de que el contenido de `GCP_CREDENTIALS` sea el JSON completo de las credenciales, correctamente formateado y escapado si es necesario.

## Funcionamiento con URLs firmadas

Dado que tu bucket tiene la prevención de acceso público habilitada, hemos adaptado el código para usar URLs firmadas temporales en lugar de hacer públicos los archivos. Esto significa:

1. Cuando un usuario sube una imagen, el archivo se almacena en tu bucket de GCS.
2. En lugar de hacer público el archivo, generamos una URL firmada que es válida por 7 días.
3. Esta URL firmada se devuelve al cliente y se guarda en la base de datos como referencia.
4. Las imágenes se muestran usando estas URLs firmadas.

**Nota**: Las URLs firmadas caducan después de 7 días. Si necesitas mostrar imágenes por más tiempo, hay varias opciones:
- Generar nuevas URLs firmadas cuando el usuario accede a la aplicación
- Crear una función programada que actualice las URLs en la base de datos periódicamente
- Cambiar la configuración de tu bucket para permitir acceso público (solo si es apropiado para tu caso de uso)

## Probar la configuración

Una vez que hayas configurado todo:

1. Reinicia la aplicación
2. Intenta subir una imagen en el formulario de estudiantes
3. Verifica que la imagen se cargue correctamente y se muestre en la interfaz

## Consideraciones adicionales

- **Seguridad**: La prevención de acceso público que tienes habilitada es una buena práctica de seguridad. Las URLs firmadas proporcionan un equilibrio entre accesibilidad y seguridad.
- **Expiración de URLs**: Considera cómo manejarás la renovación de URLs expiradas en tu aplicación.
- **Optimización**: Considera implementar redimensionamiento y compresión de imágenes antes de subirlas a GCS.
- **Costos**: Ten en cuenta que GCP cobra por almacenamiento y por ancho de banda de salida. Monitorea tu uso para evitar costos inesperados.
- **Limpieza**: Tu configuración de Soft Delete mantiene los objetos eliminados por 7 días, lo que es útil para recuperación accidental. 