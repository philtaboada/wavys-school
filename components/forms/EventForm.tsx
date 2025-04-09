"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { eventSchema, EventSchema, EventData } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
// Asume que estos hooks existen y devuelven los tipos apropiados
// import { useCreateEvent, useUpdateEvent } from "@/utils/queries/eventQueries";
// import { useGetClasses } from "@/utils/queries/classQueries";
import { SimpleClass } from "@/utils/types/class"; // Importar el tipo SimpleClass

// --- Mock Hooks (Reemplazar con los reales) ---
// Elimina estos mocks cuando tengas los hooks reales implementados
const useCreateEvent = () => ({
  mutate: (data: any, options: any) => {
    console.log("Mock Creando evento:", data);
    setTimeout(() => options.onSuccess?.({ id: Date.now(), ...data }), 1000);
    // Para simular error: setTimeout(() => options.onError?.(new Error("Error simulado al crear")), 1000);
  },
  isPending: false,
});
const useUpdateEvent = () => ({
  mutate: (data: any, options: any) => {
    console.log("Mock Actualizando evento:", data);
    setTimeout(() => options.onSuccess?.(data), 1000);
    // Para simular error: setTimeout(() => options.onError?.(new Error("Error simulado al actualizar")), 1000);
  },
  isPending: false,
});
const useGetClasses = () => ({
  data: [
    { id: 1, name: "Clase A" },
    { id: 2, name: "Clase B" },
    { id: 3, name: "Clase C (Ejemplo)" }
  ] as SimpleClass[],
  isLoading: false,
  isError: false,
});
// --- Fin Mock Hooks ---


interface EventFormProps {
  type: "create" | "update";
  data?: EventData; // Usar EventData para consistencia con la API
  setOpen: (open: boolean) => void;
}

// Helper para formatear Date a 'yyyy-MM-ddThh:mm' para datetime-local
const formatDateTimeLocal = (date: Date | string | undefined): string => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Ajustar por la zona horaria local antes de formatear
    const offset = d.getTimezoneOffset();
    const adjustedDate = new Date(d.getTime() - (offset*60*1000));
    return adjustedDate.toISOString().slice(0, 16);
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};


const EventForm = ({
  type,
  data,
  setOpen,
}: EventFormProps) => {
  const router = useRouter();
  const { data: classes, isLoading: isLoadingClasses } = useGetClasses(); // Obtener clases
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const [customError, setCustomError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<EventSchema>(
    {
      resolver: zodResolver(eventSchema),
      defaultValues: {
        id: data?.id ? String(data.id) : undefined,
        title: data?.title || "",
        description: data?.description || "",
        // Usar helper para formatear fechas para el input datetime-local
        startTime: data?.startTime ? new Date(data.startTime) : undefined,
        endTime: data?.endTime ? new Date(data.endTime) : undefined,
        classId: data?.classId ? String(data.classId) : "" // classId es string en el form
      }
    }
  );

  const onSubmit = handleSubmit((formData) => {
    try {
      setCustomError(null);

      // Validaciones adicionales si son necesarias
      if (formData.startTime >= formData.endTime) {
        setCustomError("La fecha/hora de fin debe ser posterior a la de inicio.");
        return;
      }

      // Preparar los datos para la API
      const eventApiData: EventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        // Convertir Date a string ISO para enviar a la API
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        // Convertir classId a número o null si está vacío/seleccionado "Ninguna"
        classId: formData.classId ? parseInt(formData.classId, 10) : null,
      };

      console.log('Datos procesados para enviar:', eventApiData);

      if (type === 'create') {
        createMutation.mutate(eventApiData, {
          onSuccess: (createdEvent: EventData) => {
            toast.success('Evento creado exitosamente');
            console.log('Evento creado:', createdEvent);
            reset();
            setOpen(false);
            router.refresh(); // Refrescar datos en la página
          },
          onError: (error: Error) => {
            console.error('Error al crear el evento:', error);
            setCustomError(error.message || "Ocurrió un error al crear el evento.");
            toast.error("Error al crear el evento");
          }
        });
      } else if (type === 'update' && data?.id) {
        updateMutation.mutate({
          ...eventApiData,
          id: data.id, // Asegurar que el ID se incluya para la actualización
        }, {
          onSuccess: (updatedEvent: EventData) => {
            toast.success("Evento actualizado exitosamente");
            console.log('Evento actualizado:', updatedEvent);
            reset(); // Resetear el form después de éxito
            setOpen(false);
            router.refresh(); // Refrescar datos en la página
          },
          onError: (error: Error) => {
            console.error('Error al actualizar el evento:', error);
            setCustomError(error.message || "Ocurrió un error al actualizar el evento.");
            toast.error("Error al actualizar el evento");
          }
        });
      }
    } catch (error) {
      console.error('Error en onSubmit:', error);
      setCustomError((error as Error).message || "Ocurrió un error inesperado.");
    }
  });

  const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingClasses;

  return (
    <form className="flex flex-col gap-4 sm:gap-6 w-full" onSubmit={onSubmit}>
      {/* Encabezado del formulario */}
      <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 p-4 sm:p-6 rounded-t-xl shadow-md relative overflow-hidden w-full">
        {/* Efecto decorativo */}
        <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white relative z-10 flex items-center gap-2 sm:gap-3">
          <span className="bg-white/20 p-2 rounded-lg">
            {/* Icono de Calendario */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <path d="M8 14h.01"></path>
              <path d="M12 14h.01"></path>
              <path d="M16 14h.01"></path>
              <path d="M8 18h.01"></path>
              <path d="M12 18h.01"></path>
              <path d="M16 18h.01"></path>
            </svg>
          </span>
          <span className="truncate">{type === "create" ? "Crear un nuevo evento" : "Actualizar el evento"}</span>
        </h1>
        <p className="text-white/80 mt-2 ml-10 sm:ml-12 text-sm sm:text-base max-w-3xl">
          Complete la información a continuación para {type === "create" ? "registrar un nuevo evento" : "actualizar los datos del evento seleccionado"}.
        </p>
      </div>

      {/* Container principal */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative w-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"></div>

        {/* Sección de detalles del evento */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-cyan-100">
              {/* Icono de Información */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg lg:text-xl">Detalles del evento</span>
          </div>
           <p className="text-xs sm:text-sm text-gray-500 mb-4 ml-8 sm:ml-11">Los campos con <span className="text-pink-500">*</span> son obligatorios</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Campo Título */}
            <div className="md:col-span-2 transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Título del evento *"
                name="title"
                register={register}
                error={errors?.title}
                className="bg-gray-50 focus:bg-white"
                placeholder="Ej: Reunión de padres, Excursión al museo"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line>
                  </svg>
                }
              />
            </div>

            {/* Campo Descripción */}
            <div className="md:col-span-2 transform transition-all duration-300 hover:-translate-y-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Descripción *
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={4}
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-cyan-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                placeholder="Describe el propósito y los detalles del evento..."
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Campo Fecha y Hora de Inicio */}
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Fecha y Hora de Inicio *"
                name="startTime"
                register={register}
                error={errors?.startTime}
                type="datetime-local"
                className="bg-gray-50 focus:bg-white"
                // Pasar el valor formateado al input
                defaultValue={formatDateTimeLocal(data?.startTime)}
                icon={
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="12" cy="16" r="1"></circle><path d="M12 12v4"></path>
                    </svg>
                }
              />
            </div>

             {/* Campo Fecha y Hora de Fin */}
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Fecha y Hora de Fin *"
                name="endTime"
                register={register}
                error={errors?.endTime}
                type="datetime-local"
                className="bg-gray-50 focus:bg-white"
                 // Pasar el valor formateado al input
                defaultValue={formatDateTimeLocal(data?.endTime)}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="12" cy="16" r="1"></circle><path d="M12 12v4"></path><path d="m16 16-4-4"></path>
                    </svg>
                }
              />
            </div>

            {/* Campo Clase (Opcional) */}
            <div className="md:col-span-2 flex flex-col gap-2 transform transition-all duration-300 hover:-translate-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-gray-400">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3h18v18H3zM8 8h8v8H8zM12 3v5m0 8v5M3 12h5m8 0h5"/>
                    </svg>
                </span>
                Clase Asociada (Opcional)
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-cyan-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                {...register("classId")}
                defaultValue={data?.classId ? String(data.classId) : ""}
                disabled={isLoadingClasses}
              >
                <option value="">{isLoadingClasses ? "Cargando clases..." : "Ninguna (Evento general)"}</option>
                {classes && classes.map((cls) => (
                  <option key={cls.id} value={String(cls.id)}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {/* No mostrar error para campo opcional a menos que haya una validación específica */}
              {/* errors.classId?.message && ( ... ) */}
            </div>

            {/* Campo oculto para ID en modo actualización */}
            {type === 'update' && data?.id && (
              <input type="hidden" {...register("id")} value={String(data.id)} />
            )}
          </div>
        </div>
      </div>

      {/* Mostrar error personalizado */}
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

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-end mt-2 pb-2 w-full">
        <button
          type="button"
          className="py-3 px-6 sm:px-8 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium text-base shadow-sm hover:shadow-md hover:border-gray-400 flex items-center justify-center gap-2 w-full sm:w-auto"
          onClick={() => {
            reset(); // También resetea al cancelar
            setOpen(false);
          }}
          disabled={isLoading}
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          Cancelar
        </button>
        <button
          type="submit"
          className="py-3 px-8 sm:px-10 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-xl hover:from-cyan-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:pointer-events-none w-full sm:w-auto sm:min-w-[200px] transform hover:-translate-y-1 active:translate-y-0"
          disabled={isLoading}
        >
          {isLoading ? (
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
              {type === "create" ? "Crear evento" : "Actualizar evento"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EventForm;