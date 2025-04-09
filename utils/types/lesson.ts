export type Lesson = {
  id: number;
  name: string;
  day: string;
  startTime: string | Date;
  endTime: string | Date;
  classId?: number;
  teacherId?: string;
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