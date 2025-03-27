'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import AttendanceFormTQ from "@/components/forms/AttendanceFormTQ";
import TeacherFormTQ from "@/components/forms/TeacherFormTQ";
import StudentFormTQ from "@/components/forms/StudentFormTQ";
import AssignmentFormTQ from "@/components/forms/AssignmentFormTQ";
import { createClient } from "@/utils/supabase/client";
import { useDeleteAttendance } from "@/utils/queries/attendanceQueries";
import { useDeleteTeacher, TeacherDetails } from "@/utils/queries/teacherQueries";
import { useDeleteStudent } from "@/utils/queries/studentQueries";
import { useDeleteAssignment } from "@/utils/queries/assignmentQueries";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { CircleFadingPlus, Pencil, Trash } from "lucide-react";
import { Attendance, Teacher, Student, Assignment, Exam } from "@/utils/types";
import Loading from "@/app/protected/(dashboard)/list/loading";

// Tipos para las entidades relacionadas
interface StudentData {
  id: string;
  name: string;
  surname: string;
}

interface Subject {
  id: number;
  name: string;
}

interface Lesson {
  id: number;
  name: string;
  subject?: Subject;
}

interface Class {
  id: number;
  name: string;
}

// Props para el componente
interface FormContainerTQProps {
  table: string; // "attendance" | "teacher" | "student" | "assignment" | "grades" | "exams" etc.
  type: "create" | "update" | "delete";
  id?: number;
  data?: Attendance | Teacher | Student | Assignment | Exam | TeacherDetails | undefined;
}

export default function FormContainerTQ({
  table,
  type,
  id,
  data
}: FormContainerTQProps) {
  const [open, setOpen] = useState(false);
  const [relatedData, setRelatedData] = useState<{
    students?: StudentData[];
    lessons?: Lesson[];
    subjects?: Subject[];
    classes?: Class[];
    grades?: { id: number; name: string }[];
    parents?: { id: string; name: string; surname: string }[];
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const deleteAttendanceMutation = useDeleteAttendance();
  const deleteTeacherMutation = useDeleteTeacher();
  const deleteStudentMutation = useDeleteStudent();
  const deleteAssignmentMutation = useDeleteAssignment();
  const router = useRouter();

  // Cargar datos relacionados al abrir el formulario
  const fetchRelatedData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      if (table === "attendance") {
        // Estudiantes
        const { data: students } = await supabase
          .from('Student')
          .select('id, name, surname')
          .order('surname');
        
        // Lecciones con sus materias
        const { data: lessonsData } = await supabase
          .from('Lesson')
          .select('id, name, Subject:subjectId (id, name)');
        
        // Transformar los datos al formato esperado
        const lessons = lessonsData?.map((lesson: any) => ({
          id: lesson.id,
          name: lesson.name,
          subject: lesson.Subject
        }));
        
        setRelatedData({
          students: students || [],
          lessons: lessons || []
        });
      } else if (table === "assignment") {
        // Lecciones con sus materias para asignaciones
        const { data: lessonsData } = await supabase
          .from('Lesson')
          .select('id, name, Subject:subjectId (id, name)');
        
        // Transformar los datos al formato esperado
        const lessons = lessonsData?.map((lesson: any) => ({
          id: lesson.id,
          name: lesson.name,
          subject: lesson.Subject
        }));
        
        setRelatedData({
          lessons: lessons || []
        });
      } else if (table === "teacher") {
        // Asignaturas para profesores
        const { data: subjects } = await supabase
          .from('Subject')
          .select('id, name')
          .order('name');
        
        setRelatedData({
          subjects: subjects || []
        });
      } else if (table === "student") {
        // Clases para estudiantes
        const { data: classes } = await supabase
          .from('Class')
          .select('id, name')
          .order('name');
        
        // Grados para estudiantes
        const { data: grades } = await supabase
          .from('Grade')
          .select('id, name')
          .order('name');
        
        // Padres para estudiantes
        const { data: parents } = await supabase
          .from('Parent')
          .select('id, name, surname')
          .order('surname');
        
        setRelatedData({
          classes: classes || [],
          grades: grades || [],
          parents: parents || []
        });
      }
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar la apertura del diálogo
  const handleOpen = () => {
    setOpen(true);
    fetchRelatedData();
  };

  // Manejar la eliminación
  const handleDelete = () => {
    if (!id) return;
    
    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este registro?");
    if (!confirmed) return;
    
    if (table === "attendance") {
      deleteAttendanceMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Registro eliminado correctamente");
          router.refresh();
        },
        onError: (error) => {
          toast.error(`Error al eliminar: ${error.message}`);
        }
      });
    } else if (table === "assignment") {
      deleteAssignmentMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Tarea eliminada correctamente");
          router.refresh();
        },
        onError: (error) => {
          toast.error(`Error al eliminar tarea: ${error.message}`);
        }
      });
    } else if (table === "teacher") {
      deleteTeacherMutation.mutate({ id: id.toString() }, {
        onSuccess: () => {
          toast.success("Profesor eliminado correctamente");
          router.refresh();
        },
        onError: (error) => {
          toast.error(`Error al eliminar profesor: ${error.message}`);
        }
      });
    } else if (table === "student") {
      deleteStudentMutation.mutate({ id: id.toString() }, {
        onSuccess: () => {
          toast.success("Estudiante eliminado correctamente");
          router.refresh();
        },
        onError: (error) => {
          toast.error(`Error al eliminar estudiante: ${error.message}`);
        }
      });
    }
  };

  // Renderizar el formulario según el tipo y la tabla
  const renderForm = () => {
    if (table === "attendance" && (type === "create" || type === "update")) {
      return (
        <AttendanceFormTQ
          type={type}
          data={data as Attendance}
          setOpen={setOpen}
          relatedData={relatedData}
        />
      );
    }
    if (table === "assignment" && (type === "create" || type === "update")) {
      return (
        <AssignmentFormTQ
          type={type}
          data={data as Assignment}
          setOpen={setOpen}
          relatedData={relatedData}
        />
      );
    }
    if (table === "teacher" && (type === "create" || type === "update")) {
      return (
        <TeacherFormTQ
          type={type}
          data={data as Teacher}
          setOpen={setOpen}
          relatedData={relatedData}
        />
      );
    }
    if (table === "student" && (type === "create" || type === "update")) {
      return (
        <StudentFormTQ
          type={type}
          data={data as Student}
          setOpen={setOpen}
          relatedData={relatedData}
        />
      );
    }
    // Agregar más formularios para otras tablas según sea necesario
    return <div>Formulario no disponible para esta tabla</div>;
  };

  // Renderizar el botón según el tipo
  const renderButton = () => {
    if (type === "create") {
      return (
        <button
          onClick={handleOpen}
          className="p-2 bg-blue-500 text-white rounded-full cursor-pointer"
        >
          <CircleFadingPlus className="w-6 h-6" />
        </button>
      );
    }

    if (type === "update") {
      return (
        <button onClick={handleOpen} className="text-green-500 cursor-pointer">
          <Pencil className="w-4 h-4" />
        </button>
      );
    }

    if (type === "delete") {
      return (
        <button onClick={handleDelete} className="text-red-500 cursor-pointer">
          <Trash className="w-4 h-4" />
        </button>
      );
    }
    
    return null;
  };

  return (
    <>
      {renderButton()}
      {(type === "create" || type === "update") && (
        <Dialog 
          open={open} 
          onOpenChange={setOpen}
        >
          <DialogContent 
            className="flex flex-col p-0 gap-0 border-none sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[1400px] w-[98vw] max-h-[90vh] shadow-2xl"
          >
            <DialogTitle className="sr-only">
              {type === "create" ? "Crear nuevo registro" : "Actualizar registro"}
            </DialogTitle>
            <div className="w-full overflow-auto custom-scrollbar">
              {renderForm()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 