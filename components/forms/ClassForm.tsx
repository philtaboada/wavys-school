"use client";

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { classSchema, ClassSchema } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useCreateClass, useUpdateClass } from "@/utils/queries/classQueries";
import { Class } from "@/utils/types/class";

interface ClassFormProps {
  type: "create" | "update";
  data?: Class;
  setOpen: (open: boolean) => void;
  relatedData?: {
    teachers?: { id: string; name: string; surname: string }[];
    grades?: { id: number; name: string; level?: string }[];
  };
}

const ClassForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: ClassFormProps) => {
  
  console.log("ClassForm - Tipo:", type);
  console.log("ClassForm - Data recibida:", data);
  console.log("ClassForm - RelatedData recibida:", relatedData);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      capacity: data?.capacity,
      supervisorId: data?.supervisorId || "",
      gradeId: data?.gradeId,
    }
  });

  const [customError, setCustomError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Utilizar los hooks de mutación de TanStack Query
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    try {
      setCustomError(null);
      setIsLoading(true);

      console.log('Formulario de datos antes del envio:', formData);

      //Validar los campos requeridos
      if(!formData.name || !formData.capacity || !formData.gradeId){
        setCustomError("Por favor, complete todos los campos requeridos.");
        setIsLoading(false);
        return;
      }
      
      //Preparar los datos de la clase
      const classData = {
        name: formData.name.trim(),
        capacity: formData.capacity,
        supervisorId: formData.supervisorId || undefined,
        gradeId: formData.gradeId,
      } as const;

      console.log('Datos para el envio:', classData);
      
      if (type === "create") {
        console.log('Enviando datos para crear clase:', classData);
        createMutation.mutate(classData, {
          onSuccess: () => {
            toast.success("Clase creada correctamente");
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
          ...classData,
          id: data.id,
        }, {
          onSuccess: () => {
            toast.success("Clase actualizada correctamente");
            setOpen(false);
            router.refresh();
            setIsLoading(false);
          },
          onError: (error) => {
            console.error('Error al actualizar la clase:', error);
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

  return (
    <form className="flex flex-col gap-4 sm:gap-6 w-full" onSubmit={onSubmit}>
      {/* Encabezado del formulario con gradiente mejorado */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 sm:p-6 rounded-t-xl shadow-md relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white relative z-10 flex items-center gap-2 sm:gap-3">
          <span className="bg-white/20 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white sm:hidden">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white hidden sm:block md:hidden">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white hidden md:block">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </span>
          <span className="truncate">{type === "create" ? "Crear nueva clase" : "Actualizar clase"}</span>
        </h1>
        <p className="text-white/80 mt-2 ml-10 sm:ml-12 text-sm sm:text-base max-w-3xl">
          Complete la información a continuación para {type === "create" ? "registrar una nueva clase en el sistema" : "actualizar los datos de la clase seleccionada"}
        </p>
      </div>
      
      {/* Container principal con efecto de sombra y bordes redondeados */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative w-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        {/* Sección de información de la clase */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 sm:hidden">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 hidden sm:block lg:hidden">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 hidden lg:block">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg lg:text-xl">Información de la clase</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 ml-8 sm:ml-11">Los campos con <span className="text-pink-500">*</span> son obligatorios</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Nombre de la clase *"
                name="name"
                defaultValue={data?.name}
                register={register}
                error={errors?.name}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                }
              />
            </div>
            
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Capacidad *"
                name="capacity"
                type="number"
                defaultValue={data?.capacity}
                register={register}
                error={errors?.capacity}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                }
              />
            </div>
            
            <div className="flex flex-col gap-2 transform transition-all duration-300 hover:-translate-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Supervisor
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                id="supervisorId"
                {...register("supervisorId")}
                defaultValue={data?.supervisorId || ""}
              >
                <option value="">Seleccionar supervisor</option>
                {relatedData?.teachers && relatedData.teachers.length > 0 ? (
                  relatedData.teachers.map((teacher) => (
                    <option value={teacher.id} key={teacher.id}>
                      {teacher.name} {teacher.surname}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No hay profesores disponibles</option>
                )}
              </select>
              {errors.supervisorId && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors.supervisorId.message}
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-2 transform transition-all duration-300 hover:-translate-y-1">
              <label htmlFor="gradeId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
                Grado <span className="text-pink-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                id="gradeId"
                {...register("gradeId")}
                defaultValue={data?.gradeId ? data.gradeId.toString() : ""}
                required
              >
                <option value="">Seleccionar grado</option>
                {relatedData?.grades && relatedData.grades.length > 0 ? (
                  relatedData.grades.map((grade) => (
                    <option value={grade.id} key={grade.id}>
                      {grade.name || grade.level}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No hay grados disponibles</option>
                )}
              </select>
              {errors.gradeId && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors.gradeId.message}
                </p>
              )}
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
          className="py-3 px-8 sm:px-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:pointer-events-none w-full sm:w-auto sm:min-w-[200px] transform hover:-translate-y-1 active:translate-y-0"
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
              {type === "create" ? "Crear clase" : "Actualizar clase"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
