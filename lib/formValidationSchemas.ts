import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  imgPath: z.string().optional(), // Ruta de la imagen en GCS para referencias futuras
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  imgPath: z.string().optional(), // Ruta de la imagen en GCS para referencias futuras
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Título es requerido!" }),
  description: z.string().min(1, { message: "Descripción es requerida!" }),
  date: z.coerce.date({ message: "Fecha es requerida!" }),
  classId: z.coerce.number().optional().nullable(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Nombre de usuario debe tener al menos 3 caracteres!" })
    .max(20, { message: "Nombre de usuario debe tener máximo 20 caracteres!" }),
  password: z
    .string()
    .min(8, { message: "Contraseña debe tener al menos 8 caracteres!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "Nombre es requerido!" }),
  surname: z.string().min(1, { message: "Apellido es requerido!" }),
  email: z
    .string()
    .email({ message: "Dirección de correo inválida!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().min(1, { message: "Teléfono es requerido!" }),
  address: z.string().min(1, { message: "Dirección es requerida!" }),
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const attendanceSchema = z.object({
  id: z.coerce.number().optional(),
  date: z.coerce.date({ message: "Fecha es requerida!" }),
  present: z.boolean({ message: "Estado de asistencia es requerido!" }),
  studentId: z.string().min(1, { message: "ID del estudiante es requerido!" }),
  lessonId: z.coerce.number().min(1, { message: "ID de la lección es requerido!" })
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;


export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Nombre de la lección es requerido!" }),
  classId: z.coerce.number().min(1, { message: "ID de la clase es requerido!" }),
  teacherId: z.string().min(1, { message: "ID del profesor es requerido!" }),
  subjectId: z.coerce.number().min(1, { message: "ID del tema es requerido!" }),
});

export type LessonSchema = z.infer<typeof lessonSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Título es requerido!" }),
  startDate: z.coerce.date({ message: "Fecha de inicio es requerida!" }),
  dueDate: z.coerce.date({ message: "Fecha de entrega es requerida!" }),
  lessonId: z.coerce.number().min(1, { message: "ID de la lección es requerido!" }),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.number().min(0, { message: "Puntuación debe ser mayor o igual a 0!" }),
  studentId: z.string().min(1, { message: "ID del estudiante es requerido!" }),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
});

export type ResultSchema = z.infer<typeof resultSchema>;


export const gradeSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Nombre de la grado es requerido!" }),
});

export type GradeSchema = z.infer<typeof gradeSchema>;

