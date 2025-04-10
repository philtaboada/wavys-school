// Tipos de datos
export type Class = {
  id: number;
  name: string;
  capacity?: number;
  gradeId?: number;
  supervisorId?: string;
  Grade?: {
    id: number;
    level: string;
  };
  Supervisor?: {
    id: string;
    name: string;
    surname: string;
  };
  _count?: {
    students: number;
  };
};

export type ClassListParams = {
  page: number;
  search?: string;
  gradeId?: number;
};

export type ClassListResult = {
  data: Class[];
  count: number;
};

// Tipos para mutaciones
export type CreateClassParams = {
  name: string;
  capacity: number;
  gradeId: number;
};

export type UpdateClassParams = {
  id: number;
  name?: string;
  capacity?: number;
  gradeId?: number;
};

// Simplified Class type for forms/selects
export interface SimpleClass {
  id: number;
  name: string;
}