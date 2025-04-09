/**
 * Definición de tipos comunes para la aplicación
 */

// Tipos relacionados con usuarios
export interface UserMetadata {
  avatar_url?: string;
  role?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: UserMetadata;
  app_metadata?: any;
  aud?: string;
  created_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  [key: string]: any;
}

// Tipos relacionados con perfiles
export interface Profile {
  id: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Tipos relacionados con profesores
export interface Teacher {
  id: number | string;
  name: string;
  surname?: string;
  email?: string;
  phone?: string;
  address?: string;
  img?: string;
  username?: string;
  subjects?: Array<{name: string}>;
  [key: string]: any;
} 

// types for FormContainerTQ
// Types
export type TableType = 'attendance' | 'teacher' | 'student' | 'assignment' | 'grades' | 'exams' | 'parents' | 'subjects' | 'subject' | 'parent' | 'announcement';