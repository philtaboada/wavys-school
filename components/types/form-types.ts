export type FormType = "create" | "update" | "delete";

export type FormProps = {
  type: FormType;
  data?: any;
  id?: number | string;
  relatedData?: any;
};

export type TeacherFormProps = FormProps & {
  relatedData?: {
    subjects: Array<{
      id: number;
      name: string;
    }>;
  };
};

export type StudentFormProps = FormProps & {
  relatedData?: {
    classes: Array<{
      id: number;
      name: string;
      students: {
        count: number;
      };
    }>;
    grades: Array<{
      id: number;
      level: string;
    }>;
  };
};

export type ParentFormProps = FormProps;

export type SubjectFormProps = FormProps & {
  relatedData?: {
    teachers: Array<{
      id: number;
      name: string;
      surname: string;
    }>;
  };
};

export type ClassFormProps = FormProps & {
  relatedData?: {
    teachers: Array<{
      id: number;
      name: string;
      surname: string;
    }>;
    grades: Array<{
      id: number;
      level: string;
    }>;
  };
};

export type LessonFormProps = FormProps;

export type ExamFormProps = FormProps & {
  relatedData?: {
    lessons: Array<{
      id: number;
      name: string;
    }>;
  };
};

export type AssignmentFormProps = FormProps;

export type AttendanceFormProps = FormProps & {
  relatedData?: {
    students: Array<{
      id: number;
      name: string;
      surname: string;
    }>;
    lessons: Array<{
      id: number;
      name: string;
      subject: {
        id: number;
        name: string;
      };
    }>;
  };
};

export type EventFormProps = FormProps;

export type AnnouncementFormProps = FormProps & {
  relatedData?: {
    classes: Array<{
      id: number;
      name: string;
    }>;
  };
}; 