// Tipos de datos
export type Attendance = {
  id: number;
  date: Date;
  present: boolean;
  studentId?: string;
  lessonId?: number;
  Student?: {
    id: string;
    name: string;
    surname: string;
  };
  Lesson?: {
    id: number;
    name: string;
    Subject?: {
      id: number;
      name: string;
    };
  };
};

export type AttendanceListParams = {
  page: number;
  search?: string;
  userId?: string;
  role?: string;
};

export type AttendanceListResult = {
  data: Attendance[];
  count: number;
};