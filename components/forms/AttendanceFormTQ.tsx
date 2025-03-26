"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { attendanceSchema, AttendanceSchema } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { 
  useCreateAttendance, 
  useUpdateAttendance,
} from "@/utils/queries/attendanceQueries";
import { Attendance } from "@/utils/types";

interface AttendanceFormTQProps {
  type: "create" | "update";
  data?: Attendance;
  setOpen: (open: boolean) => void;
  relatedData?: {
    students?: { id: string; name: string; surname: string }[];
    lessons?: { id: number; name: string; subject?: { name: string } }[];
  };
}

const AttendanceFormTQ = ({
  type,
  data,
  setOpen,
  relatedData,
}: AttendanceFormTQProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      id: data?.id,
      date: data?.date ? new Date(data.date) : new Date(),
      present: data?.present ?? true,
      studentId: data?.studentId || undefined,
      lessonId: data?.lessonId || undefined,
    }
  });

  // Estado para errores personalizados
  const [customError, setCustomError] = useState<string | null>(null);

  // Utilizar los hooks de mutación de TanStack Query
  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    setCustomError(null);

    if (type === "create") {
      createMutation.mutate({
        date: formData.date.toISOString(),
        present: formData.present,
        studentId: formData.studentId,
        lessonId: formData.lessonId,
      }, {
        onSuccess: () => {
          toast.success("Asistencia registrada correctamente");
          reset();
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al registrar la asistencia");
        }
      });
    } else if (formData.id) {
      updateMutation.mutate({
        id: formData.id,
        date: formData.date.toISOString(),
        present: formData.present,
        studentId: formData.studentId,
        lessonId: formData.lessonId,
      }, {
        onSuccess: () => {
          toast.success("Asistencia actualizada correctamente");
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al actualizar la asistencia");
        }
      });
    }
  });

  // Determinar si está cargando
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Registrar nueva asistencia" : "Actualizar la asistencia"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <InputField
            label="Fecha"
            name="date"
            register={register}
            error={errors?.date}
            type="datetime-local"
          />
        </div>
        
        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Estado de asistencia</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("present", { 
              setValueAs: (value) => value === "true" 
            })}
          >
            <option value="true">Presente</option>
            <option value="false">Ausente</option>
          </select>
          {errors.present?.message && (
            <p className="text-xs text-red-400">
              {errors.present.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Estudiante</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("studentId")}
          >
            <option value="">Seleccionar estudiante</option>
            {relatedData?.students?.map((student) => (
              <option value={student.id} key={student.id}>
                {student.name} {student.surname}
              </option>
            ))}
          </select>
          {errors.studentId?.message && (
            <p className="text-xs text-red-400">
              {errors.studentId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Lección</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId", { 
              valueAsNumber: true 
            })}
          >
            <option value="">Seleccionar lección</option>
            {relatedData?.lessons?.map((lesson) => (
              <option value={lesson.id} key={lesson.id}>
                {lesson.subject?.name}: {lesson.name}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">
              {errors.lessonId.message.toString()}
            </p>
          )}
        </div>

        {data && (
          <InputField
            label="Id"
            name="id"
            register={register}
            error={errors?.id}
            hidden
          />
        )}
      </div>
      
      {/* Mostrar error personalizado si existe */}
      {customError && (
        <div className="text-red-500 bg-red-50 p-2 rounded-md text-sm">
          {customError}
        </div>
      )}

      <button 
        className={`bg-blue-400 text-white p-2 rounded-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`} 
        disabled={isLoading}
      >
        {isLoading 
          ? (type === "create" ? "Registrando..." : "Actualizando...") 
          : (type === "create" ? "Registrar" : "Actualizar")}
      </button>
    </form>
  );
};

export default AttendanceFormTQ; 