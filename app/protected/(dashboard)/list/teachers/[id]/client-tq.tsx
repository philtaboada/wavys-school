'use client';

import { useTeacherDetails } from '@/utils/queries/teacherQueries';
import AnnouncementsTQ from "@/components/AnnouncementsTQ";
import BigCalendarContainerTQ from "@/components/BigCalendarContainerTQ";
import Performance from "@/components/Performance";
import Image from "next/image";
import Link from "next/link";
import { HeartPulse, Calendar1, Mail, Phone, CalendarPlus, BookOpenCheck, Presentation } from "lucide-react";
import Loading from '../../loading';

interface TeacherDetailsTQProps {
  initialRole?: string;
  initialUserId?: string;
  teacherId: string;
}

export default function TeacherDetailsTQ({ initialRole, initialUserId, teacherId }: TeacherDetailsTQProps) {
  // Usar el hook de TanStack Query para obtener los datos del profesor
  const { data: teacher, isLoading, error } = useTeacherDetails(teacherId);

  // Mostrar mensaje de error si ocurre
  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Detalles del Profesor</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {(error as Error).message}
        </pre>
      </div>
    );
  }

  // Mostrar indicador de carga mientras se obtienen los datos
  if (isLoading || !teacher) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

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
                {initialRole === "admin" && (
                  <button className="p-2 bg-lamaSkyLight rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {teacher.description || "Sin descripción disponible"}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4" />
                  <span>{teacher.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Calendar1 className="w-4 h-4" />
                  <span>
                    {new Date(teacher.birthday).toLocaleDateString()}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <CalendarPlus className="w-6 h-6" />
              <div className="">
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Asistencia</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <BookOpenCheck className="w-6 h-6" />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {teacher.counts.subjects}
                </h1>
                <span className="text-sm text-gray-400">Asignaturas</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <BookOpenCheck className="w-6 h-6" />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {teacher.counts.lessons}
                </h1>
                <span className="text-sm text-gray-400">Lecciones</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Presentation className="w-6 h-6" />
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
          <BigCalendarContainerTQ type="teacherId" id={teacher.id} />
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
        <AnnouncementsTQ />
      </div>

      {/* Estado de depuración */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-50 p-2 rounded text-xs max-w-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Información de depuración</summary>
            <p>Usuario: {initialUserId} (Rol: {initialRole})</p>
            <p>Profesor ID: {teacher.id}</p>
            <p>Asignaturas: {teacher.counts.subjects}</p>
            <p>Lecciones: {teacher.counts.lessons}</p>
            <p>Clases: {teacher.counts.classes}</p>
            {error && (
              <div className="mt-2 text-red-600">
                <p>Error: {(error as Error).message}</p>
              </div>
            )}
          </details>
        </div>
      )}
    </div>
  );
} 