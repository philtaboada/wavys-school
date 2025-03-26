import { Class } from "./class";
import { Parent } from "./parent";
// Tipos de datos
export type Student = {
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
  gradeId: number;
  classId: number;
  parentId?: string;
  Grade?: {
    id: number;
    name: string;
  };
  Class?: Class;
  Parent?: Parent;
};

export type StudentListParams = {
  page: number;
  search?: string;
  classId?: number;
  gradeId?: number;
  parentId?: string;
};

export type StudentListResult = {
  data: Student[];
  count: number;
};

// Tipos para mutaciones
export type CreateStudentParams = {
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
  gradeId: number;
  classId: number;
  parentId?: string;
};

export type UpdateStudentParams = {
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
  gradeId?: number;
  classId?: number;
  parentId?: string;
};