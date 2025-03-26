// Tipos de datos
export type Exam = {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  lessonId: number;
  lesson?: {
    id: number;
    name: string;
    subjectId?: number;
    classId?: number;
    teacherId?: string;
    subject?: {
      id: number;
      name: string;
    };
    class?: {
      id: number;
      name: string;
    };
    teacher?: {
      id: string;
      name: string;
      surname: string;
    };
  } | null;
};

export type ExamListParams = {
  page: number;
  search?: string;
  lessonId?: number;
  subjectId?: number;
  teacherId?: string;
  classId?: number;
  startDate?: string;
  endDate?: string;
};

export type ExamListResult = {
  data: Exam[];
  count: number;
};

// Tipos para mutaciones
export type CreateExamParams = { 
  title: string;
  startTime: string;
  endTime: string;
  lessonId: number;
};

export type UpdateExamParams = {
  id: number;
  title?: string;
  startTime?: string;
  endTime?: string;
  lessonId?: number;
};
