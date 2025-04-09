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
import AnnouncementForm from "./forms/AnnouncementForm";
import { createClient } from "@/utils/supabase/client";
import { useDeleteAttendance } from "@/utils/queries/attendanceQueries";
import { useDeleteTeacher, TeacherDetails } from "@/utils/queries/teacherQueries";
import { useDeleteStudent } from "@/utils/queries/studentQueries";
import { useDeleteAssignment } from "@/utils/queries/assignmentQueries";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { CircleFadingPlus, Pencil, Trash } from "lucide-react";
import { Teacher } from "@/utils/types";
import { Student } from "@/utils/types/student";
import { Assignment } from "@/utils/types/assignment";
import { Exam } from "@/utils/types/exam";
import { Parent } from "@/utils/types/parent";
import { Subject } from "@/utils/types/subject";
import ParentsForm from "./forms/ParentsForm";
import { useDeleteParent } from "@/utils/queries/parentQueries";
import SubjectForm from "./forms/SubjectForm";
import { Attendance } from "@/utils/types/attendance";
import { useDeleteSubject } from "@/utils/queries/subjectQueries";
import { useDeleteClass } from "@/utils/queries/classQueries";
import { useDeleteExam } from "@/utils/queries/examQueries";
import { useDeleteAnnouncement } from "@/utils/queries/announcementQueries";
import { Announcement } from "@/utils/types/announcement";
import { TableType } from "@/utils/types";

interface RelatedData {
  students?: Array<{ id: string; name: string; surname: string }>;
  lessons?: Array<{ id: number; name: string; subject?: { id: number; name: string } }>;
  subjects?: Array<{ id: number; name: string }>;
  classes?: Array<{ id: number; name: string }>;
  grades?: Array<{ id: number; name: string }>;
  parents?: Array<{ id: string; name: string; surname: string }>;
  teachers?: Array<{ id: string; name: string; surname: string }>;
}

// Props para el componente
interface FormContainerTQProps {
  table: TableType;
  type: 'create' | 'update' | 'delete';
  id?: number;
  data?: Attendance | Teacher | Student | Assignment | Exam | TeacherDetails | Subject | Parent | undefined;
  extraProps?: {
    relatedData?: RelatedData;
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
  const [relatedData, setRelatedData] = useState<RelatedData>(extraProps?.relatedData || {});
  const [isLoading, setIsLoading] = useState(false);
  const deleteAttendanceMutation = useDeleteAttendance();
  const deleteTeacherMutation = useDeleteTeacher();
  const deleteStudentMutation = useDeleteStudent();
  const deleteAssignmentMutation = useDeleteAssignment();
  const deleteParentMutation = useDeleteParent();
  const deleteSubjectMutation = useDeleteSubject();
  const deleteClassMutation = useDeleteClass();
  const deleteExamMutation = useDeleteExam();
  const deleteAnnouncementMutation = useDeleteAnnouncement();
  const router = useRouter();

  // Cargar datos relacionados al abrir el formulario
  const fetchRelatedData = async () => {
    //Si ya se tiene datos relacionados desde extraProps, no se necesita cargarlos
    if (extraProps?.relatedData && Object.keys(extraProps.relatedData).length > 0) {
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

      switch (table) {
        case "attendance": {
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
          break;
        }

        case "assignment": {
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
          break;
        }

        case "teacher": {
          // Asignaturas para profesores
          const { data: subjects } = await supabase
            .from('Subject')
            .select('id, name')
            .order('name');

          console.log("Subjects cargados en fetchRelatedData:", subjects);

          setRelatedData({
            subjects: subjects || []
          });
          break;
        }

        case "student": {
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
          break;
        }

        case "subject": {
          // Profesores para asignaturas
          const { data: teachers } = await supabase
            .from('Teacher')
            .select('id, name, surname')
            .order('surname');

          console.log("Teachers cargados para formulario de asignaturas:", teachers);

          setRelatedData({
            teachers: teachers || []
          });
          break;
        }

        case "announcement": {
          // Clases para anuncios
          const { data: classes, error: classError } = await supabase
            .from('Class')
            .select('id, name')
            .order('name');

          if (classError) {
            console.error('Error al cargar clases:', classError);
          } else {
            console.log("Clases cargadas para anuncios:", classes);
          }

          setRelatedData({
            classes: classes || []
          });
          break;
        }
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
    if (!id) {
      toast.error('ID no válido');
      return;
    }

    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este registro?");

    if (!confirmed) return;

    setIsLoading(true);

    const handleError = (error: Error, entityName: string) => {
      console.error(`Error al eliminar ${entityName}:`, error);
      toast.error(`Error al eliminar ${entityName}: ${error.message}`);
      setIsLoading(false);
    };

    const handleSuccess = (message: string, redirectPath?: string) => {
      toast.success(message);
      router.refresh();
      if (redirectPath) {
        router.push(redirectPath);
      }
      setIsLoading(false);
    };

    try {
      switch (table) {
        case 'parent': {
          // Verificar si el padre tiene estudiantes asociados
          const supabase = createClient();
          const { error: countError, count } = await supabase
            .from('Student')
            .select('id', { count: 'exact', head: true })
            .eq('parentId', id);

          if (countError) {
            handleError(countError, 'estudiantes');
            return;
          }

          if (count && count > 0) {
            toast.error('No se puede eliminar este padre porque tiene estudiantes asociados. Desvincule los estudiantes primero.');
            setIsLoading(false);
            return;
          }

          deleteParentMutation.mutate(
            { id: id.toString() },
            {
              onSuccess: () => handleSuccess('Padre eliminado correctamente', '/protected/list/parents'),
              onError: (error) => handleError(error, 'padre')
            }
          );
          break;
        }

        case 'attendance':
          deleteAttendanceMutation.mutate(
            { id },
            {
              onSuccess: () => handleSuccess('Registro eliminado correctamente'),
              onError: (error) => handleError(error, 'registro')
            }
          );
          break;

        case 'assignment':
          deleteAssignmentMutation.mutate(
            { id },
            {
              onSuccess: () => handleSuccess('Tarea eliminada correctamente'),
              onError: (error) => handleError(error, 'tarea')
            }
          );
          break;

        case 'teacher':
          deleteTeacherMutation.mutate(
            { id: id.toString() },
            {
              onSuccess: () => handleSuccess('Profesor eliminado correctamente'),
              onError: (error) => handleError(error, 'profesor')
            }
          );
          break;

        case 'student':
          deleteStudentMutation.mutate(
            { id: id.toString() },
            {
              onSuccess: () => handleSuccess('Estudiante eliminado correctamente', '/protected/list/students'),
              onError: (error) => handleError(error, 'estudiante')
            }
          );
          break;

        case 'announcement':
          deleteAnnouncementMutation.mutate(
            { id },
            {
              onSuccess: () => handleSuccess('Anuncio eliminado correctamente'),
              onError: (error) => handleError(error, 'anuncio')
            }
          );
          break;

        default:
          toast.error(`Tipo de tabla no soportado: ${table}`);
          setIsLoading(false);
          break;
      }
    } catch (error) {
      console.error("Error en handleDelete:", error);
      toast.error("Error al procesar la solicitud de eliminación");
      setIsLoading(false);
    }
  };

  // Renderizar el formulario según el tipo y la tabla
  const renderForm = () => {
    // Solo mostrar formularios para create y update
    if (type !== 'create' && type !== 'update') {
      return null;
    }

    // Props comunes para todos los formularios
    const commonProps = {
      type,
      setOpen,
      relatedData
    };

    // Renderizar el formulario según la tabla
    switch (table) {
      case 'teacher':
        return <TeacherFormTQ {...commonProps} data={data as TeacherDetails} />;

      case 'student':
        return <StudentFormTQ {...commonProps} data={data as Student} />;

      case 'parent':
        return <ParentsForm {...commonProps} data={data as Parent} />;

      case 'attendance':
        return <AttendanceFormTQ {...commonProps} data={data as Attendance} />;

      case 'assignment':
        return <AssignmentFormTQ {...commonProps} data={data as Assignment} />;

      case 'subject':
        return <SubjectForm {...commonProps} data={data as Subject} />;

      case 'grades':
      // Grados

      case 'exams':
      // Exámenes

      case 'announcement':
        return <AnnouncementForm {...commonProps} data={data as unknown as Announcement} />;

      default:
        return (
          <div className="p-4 text-center text-red-500 dark:text-red-400">
            Formulario no disponible para: {table}
          </div>
        );
    }
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