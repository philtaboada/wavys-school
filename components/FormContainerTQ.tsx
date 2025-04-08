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
import ExamForm from "./forms/ExamForm";
import EventForm from "./forms/EventForm";
import AnnouncementForm from "./forms/AnnouncementForm";
import LessonForm from "./forms/LessonForm";
import ResultForm from "./forms/ResultForm";
import ClassForm from "./forms/ClassForm";
import { createClient } from "@/utils/supabase/client";
import { useDeleteAttendance } from "@/utils/queries/attendanceQueries";
import { useDeleteTeacher, TeacherDetails } from "@/utils/queries/teacherQueries";
import { useDeleteStudent } from "@/utils/queries/studentQueries";
import { useDeleteAssignment } from "@/utils/queries/assignmentQueries";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { CircleFadingPlus, Pencil, Trash } from "lucide-react";
import { Teacher, Student, Assignment, Exam } from "@/utils/types";
import { Parent } from "@/utils/types/parent";
import ParentsForm from "./forms/ParentsForm";
import { useDeleteParent } from "@/utils/queries/parentQueries";
import SubjectForm from "./forms/SubjectForm";
import { Attendance } from "@/utils/types/attendance";
import { useDeleteSubject } from "@/utils/queries/subjectQueries";
import { useDeleteClass } from "@/utils/queries/classQueries";
import { useDeleteExam } from "@/utils/queries/examQueries";
import { useDeleteLesson } from "@/utils/queries/lessonQueries";
import { useDeleteEvent } from "@/utils/queries/eventQueries";
import { useDeleteAnnouncement } from "@/utils/queries/announcementQueries";
import { useDeleteResult } from "@/utils/queries/resultQueries";

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
  data?: Attendance | Teacher | Student | Assignment | Exam | TeacherDetails | Subject | undefined;
  extraProps?: {
    relatedData?: {
      students?: StudentData[];
      lessons?: Lesson[];
      subjects?: Subject[];
      classes?: Class[];
      grades?: { id: number; name: string }[];
      parents?: { id: string; name: string; surname: string }[];
      teachers?: { id: string; name: string; surname: string }[];
    }
  };
}

export default function FormContainerTQ({
  table,
  type,
  id,
  data,
  extraProps
}: FormContainerTQProps) {
  const [open, setOpen] = useState(false);
  const [relatedData, setRelatedData] = useState<{
    students?: StudentData[];
    lessons?: Lesson[];
    subjects?: Subject[];
    classes?: Class[];
    grades?: { id: number; name: string }[];
    parents?: { id: string; name: string; surname: string }[];
    teachers?: { id: string; name: string; surname: string }[];
  }>(extraProps?.relatedData || {});
  const [isLoading, setIsLoading] = useState(false);
  const deleteAttendanceMutation = useDeleteAttendance();
  const deleteTeacherMutation = useDeleteTeacher();
  const deleteStudentMutation = useDeleteStudent();
  const deleteAssignmentMutation = useDeleteAssignment();
  const deleteParentMutation = useDeleteParent();
  const deleteSubjectMutation = useDeleteSubject();
  const deleteClassMutation = useDeleteClass();
  const router = useRouter();

  // Cargar datos relacionados al abrir el formulario
  const fetchRelatedData = async () => {
    //Si ya se tiene datos relacionados desde extraProps, no se necesita cargarlos
    if(extraProps?.relatedData && Object.keys(extraProps.relatedData).length > 0) {
      if (table === 'student' && (!extraProps.relatedData.classes || extraProps.relatedData.classes.length === 0)) {
        console.log('No se encontraron clases en los datos proporcionados, cargando desde la base de datos...');
      } else {
        console.log('Usando datos relacionados proporcionados:', extraProps.relatedData);
        setRelatedData(extraProps.relatedData);
        setIsLoading(false);
        return;
      }
    }

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
        
        console.log("Subjects cargados en fetchRelatedData:", subjects);
        
        setRelatedData({
          subjects: subjects || []
        });
      } else if (table === "student") {
        // Clases para estudiantes
        const { data: classes, error: classError } = await supabase
          .from('Class')
          .select('id, name')
          .order('name');
        if (classError) {
          console.error('Error al cargar clases:', classError);
        } else {
          console.log("Clases cargadas", classes);
        }
        
        // Grados para estudiantes
        const { data: grades, error: gradeError } = await supabase
          .from('Grade')
          .select('id, level, name')
          .order('level');

        if (gradeError) {
          console.error('Error al cargar grados:', gradeError);
        } else {
          console.log("Grados cargados", grades);
        }
        
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
      } else if (table === "subject") {
        console.log('Cargando profesores para el formulario de asignaturas...');

        // Profesores para asignaturas
        const { data: teachersData, error: teachersError } = await supabase
          .from('Teacher')
          .select('id, name, surname')
          .order('surname');
        
        if (teachersError) {
          console.error('Error al cargar profesores:', teachersError);
          throw new Error(`Error al cargar profesores: ${teachersError.message}`);
        } else {
          console.log('Profesores cargados:', teachersData);
          setRelatedData(prev => ({
            ...prev,
            teachers: teachersData
          }));
        }
        console.log('Profesores cargados:', teachersData?.length || 0);
        setRelatedData(prev => ({
          ...prev,
          teachers: teachersData || []
        }));
      } else if (table === "class") {
      console.log('Cargando datos relacionados para el formulario de clases...');
      
      // Cargar profesores para supervisores
      const { data: teachersData, error: teachersError } = await supabase
        .from('Teacher')
        .select('id, name, surname')
        .order('surname');
      
      if (teachersError) {
        console.error('Error al cargar profesores:', teachersError);
        throw new Error(`Error al cargar profesores: ${teachersError.message}`);
      }
      
      // Cargar grados
      const { data: gradesData, error: gradesError } = await supabase
        .from('Grade')
        .select('id, level')
        .order('level');
      
      if (gradesError) {
        console.error('Error al cargar grados:', gradesError);
        throw new Error(`Error al cargar grados: ${gradesError.message}`);
      }

      // Transformar los datos para incluir un nombre generado basado en el nivel
      const formattedGrades = gradesData?.map(grade => ({
        id: grade.id,
        level: grade.level,
        name: `Grado ${grade.level}` // Generar un nombre basado en el nivel  
      })) || [];

      console.log('Datos relacionados cargados para clases:', {
        teachers: teachersData?.length || 0,
        grades: formattedGrades?.length || 0
      });
      
      setRelatedData({
        teachers: teachersData || [],
        grades: formattedGrades || []
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
    console.log("handleOpen ejecutado - table:", table, "type:", type);
    setOpen(true);
    fetchRelatedData();
  };

  // Manejar la eliminación
  const handleDelete = async () => {
    console.log("handleDelete called for table:", table);
    console.log("Data to delete:", data);
    console.log("ID from props:", id);
  
    // Use either data.id or id from props
    const itemId = data?.id || id;
  
    if (!itemId) {
      console.error("No ID found in data object or props");
      toast.error("Error: No se pudo identificar el elemento a eliminar");
      return;
    }
    
    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este registro?");

    if (!confirmed) return;
    
    try {
      setIsLoading(true);

      if (table === "parent") {
        console.log("Intentando eliminar padre con ID:", id);
      
        // Verificar si el padre tiene estudiantes asociados
        const supabase = createClient();
        const { data: studentsData, error: countError, count } = await supabase
          .from('Student')
          .select('id', { count: 'exact', head: true })
          .eq('parentId', id);
        
        if (countError) {
          console.error("Error al verificar estudiantes:", countError);
          toast.error(`Error al verificar estudiantes: ${countError.message}`);
          setIsLoading(false);
          return;
        }
      
        if (count && count > 0) {
          console.log(`El padre tiene ${count} estudiantes asociados, no se puede eliminar`);
          toast.error('No se puede eliminar este padre porque tiene estudiantes asociados. Desvincule los estudiantes primero.');
          setIsLoading(false);
          return;
        }
      
        // Continuar con la eliminación si no hay estudiantes
        deleteParentMutation.mutate({ id: id.toString() }, {
          onSuccess: () => {
            console.log("Padre eliminado con éxito");
            toast.success("Padre eliminado correctamente");
            router.refresh();
            router.push('/protected/list/parents');
          },
          onError: (error) => {
            console.error("Error al eliminar padre:", error);
            toast.error(`Error al eliminar padre: ${error.message}`);
          },
          onSettled: () => {
            setIsLoading(false);
          }
        });
      } else if (table === "attendance") {
        deleteAttendanceMutation.mutate({ id }, {
          onSuccess: () => {
            toast.success("Registro eliminado correctamente");
            router.refresh();
          },
          onError: (error) => {
            toast.error(`Error al eliminar: ${error.message}`);
          },
          onSettled: () => {
            setIsLoading(false);
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
          },
          onSettled: () => {
            setIsLoading(false);
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
          },
          onSettled: () => {
            setIsLoading(false);
          }
        });
      } else if (table === "student") {
        deleteStudentMutation.mutate({ id: id.toString() }, {
          onSuccess: () => {
            toast.success("Estudiante eliminado correctamente");
            router.refresh();
            router.push('/protected/list/students');
          },
          onError: (error) => {
            toast.error(`Error al eliminar estudiante: ${error.message}`);
            console.error("Error deleting student:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          }
        });
      } else if (table === "subject") {
        console.log("Deleting subject with ID:", itemId);

        deleteSubjectMutation.mutate({ id: itemId }, {
          onSuccess: () => {
            toast.success("Asignatura eliminada correctamente");
            router.refresh();
            router.push('/protected/list/subjects');
          },
          onError: (error) => {
            toast.error(`Error al eliminar asignatura: ${error.message}`);
            console.error("Error deleting subject:", error);

            // Handle specific error for subjects with lessons
            if (error.message === 'SUBJECT_HAS_LESSONS') {
              toast.error('No se puede eliminar esta asignatura porque tiene lecciones asociadas');
            }
          },
          onSettled: () => {
            setIsLoading(false);
          }
        });
      } else if (table === "class") {
        console.log("Deleting class with ID:", itemId);
        
        deleteClassMutation.mutate({ id: itemId }, {
          onSuccess: () => {
            toast.success("Clase eliminada correctamente");
            router.refresh();
            router.push('/protected/list/classes');
          },
          onError: (error) => {
            toast.error(`Error al eliminar clase: ${error.message}`);
            console.error("Error deleting class:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          }
        });
      }
      setOpen(false);
    } catch (error: any) {
      console.error("Error en handleDelete:", error);
      toast.error("Error al procesar la solicitud de eliminación");
      setIsLoading(false);
    }
  };

  // Renderizar el formulario según el tipo y la tabla
  const renderForm = () => {
    // Verificar datos relacionados después de cargar
    console.log("renderForm - Estado actual de relatedData:", relatedData);
    
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
      console.log("Renderizando StudentFormTQ con relatedData:", relatedData);
      console.log("Clases disponibles:", relatedData.classes);
      return (
        <StudentFormTQ
          type={type}
          data={data as Student}
          setOpen={setOpen}
          relatedData={relatedData}
        />
      );
    }

    if (table === "parent" && (type === "create" || type === "update")) {
      return (
        <ParentsForm
          type={type}
          data={data as Parent}
          setOpen={setOpen}
          relatedData={relatedData}
        />
      );
    }

    if (table === "subject" && (type === "create" || type === "update")) {
      return (
        <SubjectForm
          type={type}
          data={data as Subject}
          setOpen={setOpen}
          relatedData={relatedData}
        />
      );
    }

    if (table === "class" && (type === "create" || type === "update")) {
      return (
        <ClassForm
          type={type}
          data={data as Class}
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