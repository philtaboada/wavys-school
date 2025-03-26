export type Lesson = {
  id: number;
  name: string;
  class_id?: number;
  classId?: number;
  teacher_id?: string;
  teacherId?: string;
  subject_id?: number;
  subjectId?: number;
  Class?: {
    id: number;
    name: string;
  };
  Teacher?: {
    id: string;
    name: string;
    surname: string;
  };
  Subject?: {
    id: number;
    name: string;
  };
};