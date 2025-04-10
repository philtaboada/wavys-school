export type Assignment = {
  id: number;
  title: string;
  startDate: Date;
  dueDate: Date;
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

export type AssignmentListParams = {
  page: number;
  search?: string;
  classId?: number;
  teacherId?: string;
  userId?: string;
  role?: string;
};

export type AssignmentListResult = {
  data: Assignment[];
  count: number;
};