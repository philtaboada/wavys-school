// Tipos de datos
export type Class = {
  id: number;
  name: string;
  capacity?: number;
  gradeId?: number;
  Grade?: {
    id: number;
    name: string;
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