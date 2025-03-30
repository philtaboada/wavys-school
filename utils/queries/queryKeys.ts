/**
 * Utilidades para crear y gestionar claves de consulta estructuradas para TanStack Query
 * Esto mejora la mantenibilidad y evita errores al definir las claves de consulta
 */

export const queryKeys = {
  // Claves para usuarios
  users: {
    all: ['users'] as const,
    byRole: (role: string) => ['users', role] as const,
    count: (role: string) => ['users', role, 'count'] as const,
    details: (id: string) => ['users', 'details', id] as const,
  },
  
  // Claves para asistencia
  attendance: {
    all: ['attendance'] as const,
    weekly: (fromDate: string) => ['attendance', 'weekly', { from: fromDate }] as const,
    byStudent: (studentId: string) => ['attendance', 'student', studentId] as const,
    byClass: (classId: string) => ['attendance', 'class', classId] as const,
  },
  
  // Claves para eventos
  events: {
    all: ['events'] as const,
    byMonth: (year: number, month: number) => ['events', 'calendar', { year, month }] as const,
    upcoming: (limit: number = 5) => ['events', 'upcoming', { limit }] as const,
  },
  
  // Claves para finanzas
  finances: {
    all: ['finances'] as const,
    summary: (period: string) => ['finances', 'summary', period] as const,
    byCategory: (category: string) => ['finances', 'category', category] as const,
  },
  
  // Claves para anuncios
  announcements: {
    all: ['announcements'] as const,
    latest: (limit: number = 5) => ['announcements', 'latest', { limit }] as const,
  }
}; 