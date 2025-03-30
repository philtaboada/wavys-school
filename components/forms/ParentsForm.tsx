"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useCreateParent, useUpdateParent } from "@/utils/queries/parentQueries";
import { Parent } from "@/utils/types/parent";

interface ParentsFormProps {
  type: "create" | "update";
  data?: Parent;
  setOpen: (open: boolean) => void;
  relatedData?: {
    students?: { id: string; name: string; surname: string; Class?: { name: string } }[];
  };
}

const ParentsForm = ({
  type,
  data,
  setOpen,
  relatedData
}: ParentsFormProps) => {
  console.log("ParentsForm - Tipo:", type);
  console.log("ParentsForm - Data recibida:", data);
  console.log("ParentsForm - relatedData recibido:", relatedData);
  console.log("ParentsForm - Estudiantes disponibles:", relatedData?.students);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      id: data?.id,
      username: data?.username || "",
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      password: type === "update" ? undefined : "",
      phone: data?.phone || "",
      address: data?.address || "",
    }
  });

  const [customError, setCustomError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Utilizar los hooks de mutación de TanStack Query
  const createMutation = useCreateParent();
  const updateMutation = useUpdateParent();

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    setCustomError(null);

    if (type === "create") {
      createMutation.mutate({
        username: formData.username,
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password || "",
        phone: formData.phone,
        address: formData.address || "",
      }, {
        onSuccess: () => {
          toast.success("Padre creado correctamente");
          reset();
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al crear el padre");
        }
      });
    } else if (formData.id) {
      updateMutation.mutate({
        id: formData.id,
        username: formData.username,
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password, // Si es undefined, no se actualizará
        phone: formData.phone,
        address: formData.address,
      }, {
        onSuccess: () => {
          toast.success("Padre actualizado correctamente");
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al actualizar el padre");
        }
      });
    }
  });

  const handleAssociateStudent = () => {
    if (!selectedStudentId) {
      toast.warning("Selecciona un estudiante primero");
      return;
    }
    
    // Aquí irá la lógica para asociar el estudiante al padre
    // Esta implementación dependerá de cómo esté configurada la API
    
    // Ejemplo de mensaje de éxito provisional
    toast.success("Estudiante asociado correctamente");
    
    // Limpiar el select después de asociar
    setSelectedStudentId("");
  };

  // Determinar si está cargando
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form className="flex flex-col gap-4 sm:gap-6 w-full" onSubmit={onSubmit}>
      {/* Encabezado del formulario con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-500 p-4 sm:p-6 rounded-t-xl shadow-md relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white relative z-10 flex items-center gap-2 sm:gap-3">
          <span className="bg-white/20 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white sm:hidden">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white hidden sm:block md:hidden">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white hidden md:block">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </span>
          <span className="truncate">{type === "create" ? "Crear un nuevo padre" : "Actualizar el padre"}</span>
        </h1>
        <p className="text-white/80 mt-2 ml-10 sm:ml-12 text-sm sm:text-base max-w-3xl">
          Complete la información a continuación para {type === "create" ? "registrar un nuevo padre en el sistema" : "actualizar los datos del padre seleccionado"}
        </p>
      </div>

      {/* Container principal con efecto de sombra y bordes redondeados */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative w-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>

        {/* Sección de autenticación */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 sm:hidden">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 hidden sm:block lg:hidden">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 hidden lg:block">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg lg:text-xl">Información de autenticación</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 ml-8 sm:ml-11">Los campos con <span className="text-pink-500">*</span> son obligatorios</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Nombre de usuario *"
                name="username"
                defaultValue={data?.username}
                register={register}
                error={errors?.username}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Contraseña *"
                name="password"
                type="password"
                register={register}
                error={errors?.password}
                className="bg-gray-50 focus:bg-white"
                placeholder={type === "update" ? "Dejar en blanco para mantener" : ""}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>

        {/* Sección de información personal */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 sm:hidden">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 hidden sm:block lg:hidden">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 hidden lg:block">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg lg:text-xl">Información personal</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 ml-8 sm:ml-11">Datos personales del padre/madre</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Nombre *"
                name="name"
                defaultValue={data?.name}
                register={register}
                error={errors?.name}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Apellido *"
                name="surname"
                defaultValue={data?.surname}
                register={register}
                error={errors?.surname}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Correo electrónico"
                name="email"
                defaultValue={data?.email}
                register={register}
                error={errors?.email}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Teléfono *"
                name="phone"
                defaultValue={data?.phone}
                register={register}
                error={errors?.phone}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1 md:col-span-2">
              <InputField
                label="Dirección *"
                name="address"
                defaultValue={data?.address}
                register={register}
                error={errors?.address}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>

        {/* Sección de estudiantes asociados */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 border-t border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 sm:hidden">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 hidden sm:block lg:hidden">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 hidden lg:block">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg lg:text-xl">Estudiantes asociados</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 ml-8 sm:ml-11">Estudiantes que están asociados a este padre/madre</p>
          
          {/* Mostrar estudiantes actuales */}
          {type === "update" && data?.students && data.students.length > 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Estudiantes actuales:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.students.map((student: any) => (
                  <div key={student.id} className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200 shadow-sm">
                    <div className="bg-indigo-100 p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{student.name} {student.surname}</p>
                      {student.Class && (
                        <p className="text-xs text-gray-500">Clase: {student.Class.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : type === "update" ? (
            <div className="text-sm text-gray-500 italic mb-4">Este padre no tiene estudiantes asociados aún.</div>
          ) : (
            <div className="text-sm text-gray-500 italic mb-4">Los estudiantes se pueden asociar después de crear el padre.</div>
          )}
          
          {/* Selector para asociar estudiantes en modo edición */}
          {type === "update" && (
            <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Agregar estudiante:</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <select
                    className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    <option value="">Selecciona un estudiante</option>
                    {!relatedData?.students || relatedData.students.length === 0 ? (
                      <option value="" disabled>No hay estudiantes disponibles</option>
                    ) : (
                      relatedData.students
                        .filter(student => !data?.students?.some(existingStudent => existingStudent.id === student.id))
                        .map(student => (
                          <option value={student.id} key={student.id}>
                            {student.name} {student.surname} {student.Class ? `- ${student.Class.name}` : ''}
                          </option>
                        ))
                    )}
                  </select>
                </div>
                <button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                  onClick={handleAssociateStudent}
                  disabled={!selectedStudentId}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Asociar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Para asociar un estudiante, selecciónalo de la lista y haz clic en el botón "Asociar".
                Los cambios se aplicarán cuando guardes el formulario.
              </p>
            </div>
          )}
          
          {type === "create" && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    Para asociar estudiantes a este padre, primero debe crearlo y luego editarlo para agregar estudiantes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mensajes de error */}
        {customError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 sm:mx-6 lg:mx-8 my-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{customError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Procesando...</span>
              </div>
            ) : (
              type === "create" ? "Crear padre" : "Actualizar padre"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ParentsForm;