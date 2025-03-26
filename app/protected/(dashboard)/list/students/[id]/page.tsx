import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import { useUserRole } from "@/utils/hooks";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HeartPulse, Calendar1, Mail, Phone, CalendarPlus, ClipboardCheck, BookOpenCheck, Presentation } from "lucide-react";

enum UserSex {
  MALE = "MALE",
  FEMALE = "FEMALE"
}
interface Student {
  id: string;
  username: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  address: string;
  img: string | null;
  bloodType: string;
  sex: UserSex;
  createdAt: string | Date;
  parentId: string;
  classId: number;
  gradeId: number;
  birthday: string | Date;
}
interface Class {
  id: number;
  name: string;
  capacity: number;
  supervisorId: string | null;
  gradeId: number;
}


const SingleStudentPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  // Simplemente usar params.id sin desestructurar
  const id = params.id;

  const supabase = await createClient();
  const { role } = await useUserRole();

  const { data: studentData, error: studentError } = await supabase
    .from('Student')
    .select('*')
    .eq('id', id)
    .single();

  if (studentError || !studentData) {
    return notFound();
  }

  const { data: classData, error: classError } = await supabase
    .from('Class')
    .select('*')
    .eq('id', studentData.classId)
    .single();

  if (classError || !classData) {
    return notFound();
  }

  const { count: lessonsCount, error: countError } = await supabase
    .from('Lesson')
    .select('*', { count: 'exact', head: true })
    .eq('classId', classData.id);

  if (countError) {
    console.error('Error contando lecciones:', countError);
  }

  const student = {
    ...studentData,
    class: {
      ...classData,
      _count: {
        Lesson: lessonsCount || 0
      }
    }
  } as Student & {
    class: Class & { _count: { lessons: number } };
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaRedLighta py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <img src={student.img || "/noAvatar.png"} alt="" className="w-36 h-36 rounded-full object-cover" />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {student.name + " " + student.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="student" type="update" data={student} />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {student.class.name}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4" />
                  <span>{student.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Calendar1 className="w-4 h-4" />
                  <span>
                    {new Intl.DateTimeFormat("es-ES").format(
                      typeof student.birthday === 'string'
                        ? new Date(student.birthday)
                        : student.birthday
                    )}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{student.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{student.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <CalendarPlus className="w-6 h-6" />
              <Suspense fallback="loading...">
                <StudentAttendanceCard id={student.id} />
              </Suspense>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <ClipboardCheck className="w-6 h-6" />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {student.class.name.charAt(0)}th
                </h1>
                <span className="text-sm text-gray-400">Grado</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <BookOpenCheck className="w-6 h-6" />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {student.class._count.lessons}
                </h1>
                <span className="text-sm text-gray-400">Lecciones</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Presentation className="w-6 h-6" />
              <div className="">
                <h1 className="text-xl font-semibold">{student.class.name}</h1>
                <span className="text-sm text-gray-400">Clase</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Horario del estudiante</h1>
          <BigCalendarContainer type="classId" id={student.class.id} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Accesos directos</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/protected/list/lessons?classId=${student.class.id}`}
            >
              Lecciones del estudiante
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/protected/list/teachers?classId=${student.class.id}`}
            >
              Profesores del estudiante
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/protected/list/exams?classId=${student.class.id}`}
            >
              Exámenes del estudiante
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/protected/list/assignments?classId=${student.class.id}`}
            >
              Trabajos del estudiante
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/protected/list/results?studentId=${student.id}`}
            >
              Resultados del estudiante
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
