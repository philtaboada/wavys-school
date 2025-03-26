# Wavys College - Sistema de Gestión Educativa

<p align="center">
  Plataforma educativa completa para la gestión de estudiantes, asistencias, calificaciones y más.
</p>

<p align="center">
  <a href="#características"><strong>Características</strong></a> ·
  <a href="#tecnologías"><strong>Tecnologías</strong></a> ·
  <a href="#estructura-del-proyecto"><strong>Estructura</strong></a> ·
  <a href="#ejecutar-localmente"><strong>Ejecutar localmente</strong></a> ·
  <a href="#TanStack-Query-y-Supabase"><strong>TanStack Query y Supabase</strong></a>
</p>

## Características

- **Gestión de usuarios** con diferentes roles (administradores, profesores, estudiantes, padres)
- **Control de asistencia** para estudiantes
- **Registro de calificaciones** y evaluaciones
- **Gestión de horarios** y cursos
- **Sistema de notificaciones** para comunicación entre usuarios
- **Paneles personalizados** según el rol del usuario
- **Interfaz moderna y responsive** construida con Tailwind CSS

## Tecnologías

- [Next.js 14](https://nextjs.org/) - Framework de React para desarrollo web
- [Supabase](https://supabase.com/) - Backend como servicio (BaaS)
- [TanStack Query](https://tanstack.com/query) - Gestión de estado de datos asíncronos
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitario
- [TypeScript](https://www.typescriptlang.org/) - Superset de JavaScript tipado
- [shadcn/ui](https://ui.shadcn.com/) - Componentes reutilizables

## Estructura del proyecto

```
wavys-college/
├── app/                      # Directorio principal de la aplicación Next.js
│   ├── attendance/           # Funcionalidad de control de asistencia
│   ├── examples/             # Ejemplos y tutoriales
│   ├── layout.tsx            # Layout principal de la aplicación
│   └── page.tsx              # Página principal
├── components/               # Componentes reutilizables
├── lib/                      # Utilidades y configuraciones
├── public/                   # Archivos estáticos
├── styles/                   # Estilos globales
├── utils/                    # Utilidades globales
│   ├── queries/              # Hooks de TanStack Query para Supabase
│   └── supabase/             # Configuración de Supabase
└── ...
```

## Ejecutar localmente

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/wavys-college.git
   cd wavys-college
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn
   # o
   pnpm install
   ```

3. Configura las variables de entorno:
   - Renombra `.env.example` a `.env.local`
   - Actualiza las credenciales de Supabase

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   # o
   pnpm dev
   ```

5. Navega a [http://localhost:3000](http://localhost:3000)

## TanStack Query y Supabase

Este proyecto utiliza TanStack Query (anteriormente React Query) para gestionar las solicitudes a la API de Supabase, proporcionando:

- **Caché inteligente** para datos previamente obtenidos
- **Revalidación automática** de datos obsoletos
- **Gestión de mutaciones** con invalidación automática de caché
- **Deduplicación de solicitudes** para mejorar el rendimiento
- **Estados de carga y error** fáciles de usar

### Hooks personalizados

Hemos creado un conjunto de hooks personalizados para simplificar la integración:

```tsx
// Ejemplo de consulta
const { data, isLoading, error } = useAttendanceList({
  page: 1,
  search: 'valor de búsqueda'
});

// Ejemplo de mutación
const createAttendance = useCreateAttendance();
createAttendance.mutate({
  studentId: '123',
  lessonId: 456,
  date: '2023-07-15',
  present: true
});
```

Consulta el directorio `utils/queries` para ver todos los hooks disponibles y sus ejemplos de uso.

### Ejemplo completo

Para ver un ejemplo completo de la integración, visita:

- `/examples/attendance` - Ejemplo interactivo de gestión de asistencias
- `utils/queries/README.md` - Documentación detallada sobre el uso de los hooks

## Equipo

- Juan Pérez - Desarrollador Frontend
- María López - Desarrolladora Backend
- Carlos González - Diseñador UI/UX

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
