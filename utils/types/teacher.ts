// Tipos de datos
export type Teacher = {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  address?: string;
  img?: string;
  imgPath?: string;
  bloodType?: string;
  sex?: string;
  birthday?: string;
  subjects?: {
    id: number;
    name: string;
  }[];
};

export type TeacherListParams = {
  page: number;
  search?: string;
  subjectId?: number;
};

export type TeacherListResult = {
  data: Teacher[];
  count: number;
};

// Tipos para mutaciones
export type CreateTeacherParams = {
  username: string;
  name: string;
  surname: string;
  email?: string;
  password: string;
  phone?: string;
  address?: string;
  img?: string;
  imgPath?: string;
  bloodType?: string;
  sex?: string;
  birthday?: string;
  subjects?: number[];
};

export type UpdateTeacherParams = {
  id: string;
  username?: string;
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  img?: string;
  imgPath?: string;
  bloodType?: string;
  sex?: string;
  birthday?: string;
  subjects?: number[];
};
