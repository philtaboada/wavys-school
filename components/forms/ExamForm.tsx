"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useCreateExam, useUpdateExam } from "@/utils/queries/examQueries";
import { z } from "zod";

// Definimos el esquema de validación
const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Título del examen es requerido!" }),
  startTime: z.coerce.date({ message: "Fecha de inicio es requerida!" }),
  endTime: z.coerce.date({ message: "Fecha de finalización es requerida!" }),
  lessonId: z.coerce.number().min(1, { message: "Lección es requerida!" }),
});

// Tipo inferido del esquema de validación
type ExamSchema = z.infer<typeof examSchema>;

// Definimos una interfaz para el examen que coincide con el modelo
interface ExamData {
  id?: number;
  title: string;
  startTime: Date;
  endTime: Date;
  lessonId: number;
}

interface ExamFormProps {
  type: "create" | "update";
  data?: ExamData;
  setOpen: (open: boolean) => void;
  relatedData?: {
    lessons?: { id: number; name: string }[];
  };
}

const ExamForm = ({
  type,
  data,
  setOpen,
  relatedData
}: ExamFormProps) => {

  // Depuración para ver qué datos estamos recibiendo
  console.log("ExamForm - Tipo:", type);
  console.log("ExamForm - Data recibida:", data);
  console.log("ExamForm - RelatedData recibida:", relatedData);

  // Formatear las horas para el formato de entrada datetime-local
  const formatTimeForInput = (dateTime?: Date | string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      id: data?.id,
      title: data?.title || "",
      startTime: data?.startTime ? new Date(data.startTime) : undefined,
      endTime: data?.endTime ? new Date(data.endTime) : undefined,
      lessonId: data?.lessonId
    }
  });

  const [customError, setCustomError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Utilizar los hooks de mutación de TanStack Query
  const createMutation = useCreateExam();
  const updateMutation = useUpdateExam();

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    try {
      setCustomError(null);
      setIsLoading(true);

      console.log('Formulario de datos antes del envío:', formData);

      // Validar los campos requeridos
      if (!formData.title || !formData.startTime || !formData.endTime || !formData.lessonId) {
        setCustomError("Por favor, complete todos los campos requeridos.");
        setIsLoading(false);
        return;
      }

      // Validar que la hora de finalización sea posterior a la de inicio
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        setCustomError("La fecha de finalización debe ser posterior a la fecha de inicio.");
        setIsLoading(false);
        return;
      }

      // Preparar los datos del examen
      const examData = {
        title: formData.title.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        lessonId: formData.lessonId,
      };

      console.log('Datos para el envío:', examData);

      if (type === "create") {
        console.log('Enviando datos para crear examen:', examData);
        createMutation.mutate(examData as any, {
          onSuccess: () => {
            toast.success("Examen creado correctamente");
            reset();
            setOpen(false);
            router.refresh();
            setIsLoading(false);
          },
          onError: (error) => {
            setCustomError(error.message);
            setIsLoading(false);
          }
        });
      } else if (type === 'update' && data?.id) {
        updateMutation.mutate({
          ...examData,
          id: data.id,
        } as any, {
          onSuccess: () => {
            toast.success("Examen actualizado correctamente");
            setOpen(false);
            router.refresh();
            setIsLoading(false);
          },
          onError: (error) => {
            console.error('Error al actualizar el examen:', error);
            setCustomError(error.message);
            setIsLoading(false);
          }
        });
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      setCustomError((error as Error).message);
      setIsLoading(false);
    }
  });

  // Determinar si está cargando
  const isSubmitting = createMutation.isPending || updateMutation.isPending || isLoading;

  return (
    <form className="flex flex-col gap-4 sm:gap-6 w-full" onSubmit={onSubmit}>
      {/* Encabezado del formulario con gradiente mejorado */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 sm:p-6 rounded-t-xl shadow-md relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white relative z-10 flex items-center gap-2 sm:gap-3">
          <span className="bg-white/20 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white sm:hidden">
              <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white hidden sm:block md:hidden">
              <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white hidden md:block">
              <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"></path>
            </svg>
          </span>
          <span className="truncate">{type === "create" ? "Crear nuevo examen" : "Actualizar examen"}</span>
        </h1>
        <p className="text-white/80 mt-2 ml-10 sm:ml-12 text-sm sm:text-base max-w-3xl">
          Complete la información a continuación para {type === "create" ? "registrar un nuevo examen en el sistema" : "actualizar los datos del examen seleccionado"}
        </p>
      </div>
      
      {/* Container principal con efecto de sombra y bordes redondeados */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative w-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        {/* Sección de información del examen */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 sm:hidden">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 hidden sm:block lg:hidden">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 hidden lg:block">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg lg:text-xl">Información del examen</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 ml-8 sm:ml-11">Los campos con <span className="text-pink-500">*</span> son obligatorios</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Título del examen *"
                name="title"
                defaultValue={data?.title}
                register={register}
                error={errors?.title}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                }
              />
            </div>

            <div className="flex flex-col gap-2 transform transition-all duration-300 hover:-translate-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                </svg>
                Lección asociada <span className="text-pink-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                {...register("lessonId")}
                defaultValue={data?.lessonId}
              >
                <option value="">Seleccionar lección</option>
                {relatedData?.lessons && relatedData.lessons.length > 0 ? (
                  relatedData.lessons.map((lesson) => (
                    <option value={lesson.id} key={lesson.id}>
                      {lesson.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No hay lecciones disponibles</option>
                )}
              </select>
              {errors.lessonId?.message && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors.lessonId.message.toString()}
                </p>
              )}
            </div>

            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Fecha y hora de inicio *"
                name="startTime"
                type="datetime-local"
                defaultValue={formatTimeForInput(data?.startTime)}
                register={register}
                error={errors?.startTime}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                }
              />
            </div>

            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Fecha y hora de finalización *"
                name="endTime"
                type="datetime-local"
                defaultValue={formatTimeForInput(data?.endTime)}
                register={register}
                error={errors?.endTime}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                }
              />
            </div>
            
            {data && (
              <InputField
                label="Id"
                name="id"
                defaultValue={data?.id}
                register={register}
                error={errors?.id}
                hidden
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Mostrar error personalizado si existe */}
      {customError && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl shadow-sm flex items-center gap-3 animate-pulse w-full">
          <div className="bg-red-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div>
            <p className="font-medium">Error en el proceso</p>
            <p className="text-sm">{customError}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-end mt-2 pb-2 w-full">
        <button 
          type="button" 
          className="py-3 px-6 sm:px-8 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium text-base shadow-sm hover:shadow-md hover:border-gray-400 flex items-center justify-center gap-2 w-full sm:w-auto"
          onClick={() => setOpen(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          Cancelar
        </button>
        <button 
          type="submit" 
          className="py-3 px-8 sm:px-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:pointer-events-none w-full sm:w-auto sm:min-w-[200px] transform hover:-translate-y-1 active:translate-y-0"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {type === "create" ? "Creando..." : "Actualizando..."}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              {type === "create" ? "Crear examen" : "Actualizar examen"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ExamForm;
