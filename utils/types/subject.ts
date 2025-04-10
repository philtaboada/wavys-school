// Tipos de datos
export type Subject = {
  id: number;
  name: string;
  teachers?: {
    id: string;
    name: string;
    surname: string;
  }[];
};

export type SubjectListParams = {
  page: number;
  search?: string;
  teacherId?: string;
};

export type SubjectListResult = {
  data: Subject[];
  count: number;
};

// Tipos para mutaciones
export type CreateSubjectParams = {
  name: string;
  teachers?: string[];
};

export type UpdateSubjectParams = {
  id: number;
  name: string;
  teachers?: string[];
};
