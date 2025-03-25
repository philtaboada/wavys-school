import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type TeacherDetails = {
  id: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  address: string;
  img?: string | null;
  bloodType: string;
  sex: string;
  createdAt: Date;
  birthday: Date;
  description?: string | null;
  counts: {
    subjects: number;
    lessons: number;
    classes: number;
  };
};

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata as { role?: string })?.role || '';
  const userId = user?.id || '';

  // Log para depuración - Información del usuario
  console.log('DEBUG - Usuario:', { userId, role });

  // 1. Obtener información básica del profesor
  const { data: teacherData, error: teacherError } = await supabase
    .from('Teacher')
    .select('*')
    .eq('id', id)
    .single();

  if (teacherError || !teacherData) {
    console.error('Error al obtener datos del profesor:', teacherError);
    return notFound();
  }

  // 2. Obtener conteo de asignaturas del profesor
  const { data: subjectsData, error: subjectsError } = await supabase
    .from('subject_teacher')
    .select('subject_id, Subject(*)')
    .eq('teacher_id', id);

  const subjectsCount = subjectsData?.length || 0;

  // 3. Obtener conteo de lecciones del profesor
  const { count: lessonsCount, error: lessonsError } = await supabase
    .from('Lesson')
    .select('*', { count: 'exact', head: true })
    .eq('teacherId', id);

  // 4. Obtener conteo de clases del profesor
  const { count: classesCount, error: classesError } = await supabase
    .from('Class')
    .select('*', { count: 'exact', head: true })
    .eq('supervisorId', id);

  // Combinar toda la información
  const teacher: TeacherDetails = {
    ...teacherData,
    counts: {
      subjects: subjectsCount,
      lessons: lessonsCount || 0,
      classes: classesCount || 0
    }
  };

  // Log para depuración
  console.log('DEBUG - Datos del profesor:', { 
    id: teacher.id,
    name: `${teacher.name} ${teacher.surname}`,
    counts: teacher.counts
  });

  // Si hay errores en alguna consulta, mostrarlos en consola
  if (subjectsError) console.error('Error al obtener asignaturas:', subjectsError);
  if (lessonsError) console.error('Error al obtener lecciones:', lessonsError);
  if (classesError) console.error('Error al obtener clases:', classesError);

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaRedLighta py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={teacher.img || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {teacher.name + " " + teacher.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {teacher.description || "Sin descripción disponible"}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{teacher.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>
                    {new Date(teacher.birthday).toLocaleDateString()}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Asistencia</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {teacher.counts.subjects}
                </h1>
                <span className="text-sm text-gray-400">Asignaturas</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {teacher.counts.lessons}
                </h1>
                <span className="text-sm text-gray-400">Lecciones</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {teacher.counts.classes}
                </h1>
                <span className="text-sm text-gray-400">Clases</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Horario del profesor</h1>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Accesos directos</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
           <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/protected/list/classes?supervisorId=${teacher.id}`}
            >
              Clases del profesor
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/protected/list/students?teacherId=${teacher.id}`}
            >
              Estudiantes del profesor
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/protected/list/lessons?teacherId=${teacher.id}`}
            >
              Lecciones del profesor
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/protected/list/exams?teacherId=${teacher.id}`}
            >
              Exámenes del profesor
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/protected/list/assignments?teacherId=${teacher.id}`}
            >
              Trabajos del profesor
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
      
      {/* Estado de depuración */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-50 p-2 rounded text-xs max-w-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Información de depuración</summary>
            <p>Usuario: {userId} (Rol: {role})</p>
            <p>Profesor ID: {id}</p>
            <p>Asignaturas: {teacher.counts.subjects}</p>
            <p>Lecciones: {teacher.counts.lessons}</p>
            <p>Clases: {teacher.counts.classes}</p>
            {teacherError && (
              <div className="mt-2 text-red-600">
                <p>Error: {JSON.stringify(teacherError)}</p>
              </div>
            )}
          </details>
        </div>
      )}
    </div>
  );
};

export default SingleTeacherPage;
