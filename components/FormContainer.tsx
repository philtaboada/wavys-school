import FormModal from "./FormModal";
import { createClient } from "@/utils/supabase/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata as { role?: string })?.role;
  const currentUserId = user?.id;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const { data: subjectTeachers } = await supabase
          .from('teacher')
          .select('id, name, surname');
        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const { data: classGrades } = await supabase
          .from('grade')
          .select('id, level');
        const { data: classTeachers } = await supabase
          .from('teacher')
          .select('id, name, surname');
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const { data: teacherSubjects } = await supabase
          .from('subject')
          .select('id, name');
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const { data: studentGrades } = await supabase
          .from('grade')
          .select('id, level');
        const { data: studentClasses } = await supabase
          .from('class')
          .select('*, students(count)');
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;
      case "exam":
        const { data: examLessons } = await supabase
          .from('lesson')
          .select('id, name')
          .eq(role === "teacher" ? 'teacherId' : '', role === "teacher" ? currentUserId : '');
        relatedData = { lessons: examLessons };
        break;
      case "announcement":
        const { data: announcementClasses } = await supabase
          .from('class')
          .select('id, name')
          .eq(role === "teacher" ? 'supervisorId' : '', role === "teacher" ? currentUserId : '');
        relatedData = { classes: announcementClasses };
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
