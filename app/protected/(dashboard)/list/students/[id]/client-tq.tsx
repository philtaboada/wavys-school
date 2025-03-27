'use client';

import { useStudentDetails } from '@/utils/queries/studentQueries';
import AnnouncementsTQ from "@/components/AnnouncementsTQ";
import BigCalendarContainerTQ from "@/components/BigCalendarContainerTQ";
import FormContainerTQ from "@/components/FormContainerTQ";
import Performance from "@/components/Performance";
import Image from "next/image";
import Link from "next/link";
import { HeartPulse, Calendar1, Mail, Phone, CalendarPlus, ClipboardCheck, BookOpenCheck, Presentation } from "lucide-react";
import Loading from '../../loading';
import { Suspense } from 'react';

interface StudentDetailsTQProps {
  initialRole?: string;
  initialUserId?: string;
  studentId: string;
}

export default function StudentDetailsTQ({ initialRole, initialUserId, studentId }: StudentDetailsTQProps) {
  // Usar el hook de TanStack Query para obtener los datos del estudiante
  const { data: student, isLoading, error } = useStudentDetails(studentId);

  // Mostrar mensaje de error si ocurre
  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Detalles del Estudiante</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {(error as Error).message}
        </pre>
      </div>
    );
  }

  // Mostrar indicador de carga mientras se obtienen los datos
  if (isLoading || !student) {
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
                src={student.img || "/noAvatar.png"} 
                alt="" 
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover" 
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {student.name + " " + student.surname}
                </h1>
                {initialRole === "admin" && (
                  <FormContainerTQ table="student" type="update" data={student as any} />
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
              <div className="">
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Asistencia</span>
              </div>
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
          <BigCalendarContainerTQ type="classId" id={student.class.id} />
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
        <AnnouncementsTQ />
      </div>

      {/* Estado de depuración */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-50 p-2 rounded text-xs max-w-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Información de depuración</summary>
            <p>Usuario: {initialUserId} (Rol: {initialRole})</p>
            <p>Estudiante ID: {student.id}</p>
            <p>Clase: {student.class.name}</p>
            <p>Lecciones: {student.class._count.lessons}</p>
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