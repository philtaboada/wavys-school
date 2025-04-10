import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/server";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TeacherFormTQ from "./forms/TeacherFormTQ";
import StudentFormTQ from "./forms/StudentFormTQ";
import ParentForm from "./forms/ParentForm";
import SubjectForm from "./forms/SubjectForm";
import ClassForm from "./forms/ClassForm";
import LessonForm from "./forms/LessonForm";
import ExamForm from "./forms/ExamForm";
import AssignmentFormTQ from "./forms/AssignmentFormTQ";
import AttendanceFormTQ from "./forms/AttendanceFormTQ";
import EventForm from "./forms/EventForm";
import AnnouncementForm from "./forms/AnnouncementForm";
import { FormType } from "./types/form-types";

export type FormModalProps = {
  table: string;
  type: FormType;
  data?: any;
  id?: number | string;
  relatedData?: any;
};

const FormModal = ({ table, type, data, id, relatedData }: FormModalProps) => {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  const renderForm = () => {
    switch (table) {
      case "teacher":
        return <TeacherFormTQ type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} relatedData={relatedData} />;
      case "student":
        return <StudentFormTQ type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} relatedData={relatedData} />;
      case "parent":
        return <ParentForm type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} />;
      case "subject":
        return <SubjectForm type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} relatedData={relatedData} />;
      case "class":
        return <ClassForm type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} relatedData={relatedData} />;
      case "lesson":
        return <LessonForm type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} />;
      case "exam":
        return <ExamForm type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} relatedData={relatedData} />;
      case "assignment":
        return <AssignmentFormTQ type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} />;
      case "attendance":
        return <AttendanceFormTQ type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} relatedData={relatedData} />;
      case "event":
        return <EventForm type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} />;
      case "announcement":
        return <AnnouncementForm type={type === "delete" ? "update" : type} data={data} setOpen={setOpen} relatedData={relatedData} />;
      default:
        return <div>Formulario no encontrado</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "create" && "Crear"}
            {type === "update" && "Editar"}
            {type === "delete" && "Eliminar"} {table}
          </DialogTitle>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
};

export default FormModal; 