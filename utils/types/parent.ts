// Tipos de datos
export type Parent = {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  address?: string;
  students?: any[];
};

export type ParentListParams = {
  page: number;
  search?: string;
  studentId?: string;
  classId?: number;
};

export type ParentListResult = {
  data: Parent[];
  count: number;
};

// Tipos para mutaciones
export type CreateParentParams = {
  username: string;
  name: string;
  surname: string;
  email?: string;
  password: string;
  phone?: string;
  address?: string;
};

export type UpdateParentParams = {
  id: string;
  username?: string;
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
};