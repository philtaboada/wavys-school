"use client";

import FormModal from "@/components/FormModal";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

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

const FormContainer = ({ table, type, data, id }: FormContainerProps) => {
  const [open, setOpen] = useState(true);
  const [relatedData, setRelatedData] = useState<any>({});

  const fetchRelatedData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const role = (user?.user_metadata as { role?: string })?.role;
    const currentUserId = user?.id;

    if (type !== "delete") {
      switch (table) {
        case "subject":
          const { data: subjectTeachers } = await supabase
            .from('teacher')
            .select('id, name, surname');
          setRelatedData({ teachers: subjectTeachers });
          break;
        case "class":
          const { data: classGrades } = await supabase
            .from('grade')
            .select('id, level');
          const { data: classTeachers } = await supabase
            .from('teacher')
            .select('id, name, surname');
          setRelatedData({ teachers: classTeachers, grades: classGrades });
          break;
        case "teacher":
          const { data: teacherSubjects } = await supabase
            .from('subject')
            .select('id, name');
          setRelatedData({ subjects: teacherSubjects });
          break;
        case "student":
          const { data: studentGrades } = await supabase
            .from('grade')
            .select('id, level');
          const { data: studentClasses } = await supabase
            .from('class')
            .select('*, students(count)');
          setRelatedData({ classes: studentClasses, grades: studentGrades });
          break;
        case "exam":
          const { data: examLessons } = await supabase
            .from('lesson')
            .select('id, name')
            .eq(role === "teacher" ? 'teacherId' : '', role === "teacher" ? currentUserId : '');
          setRelatedData({ lessons: examLessons });
          break;
        case "announcement":
          const { data: announcementClasses } = await supabase
            .from('class')
            .select('id, name')
            .eq(role === "teacher" ? 'supervisorId' : '', role === "teacher" ? currentUserId : '');
          setRelatedData({ classes: announcementClasses });
          break;
        case "attendance":
          const { data: attendanceStudents } = await supabase
            .from('student')
            .select('id, name, surname');
          
          const { data: attendanceLessons } = await supabase
            .from('lesson')
            .select('id, name, subject:subjectId(id, name)');
          
          setRelatedData({ 
            students: attendanceStudents, 
            lessons: attendanceLessons 
          });
          break;
        default:
          break;
      }
    }
  };

  useEffect(() => {
    fetchRelatedData();
  }, []);

  return (
    <div className="w-full">
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
