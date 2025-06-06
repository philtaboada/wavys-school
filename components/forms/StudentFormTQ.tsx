'use client';

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useCreateStudent, useUpdateStudent } from "@/utils/queries/studentQueries";
import { Student } from "@/utils/types/student";
import Image from "next/image";
import { blob } from "stream/consumers";

// Tipo para la imagen con información adicional de la URL firmada
type ImageInfo = {
  url: string;
  path?: string;
  expiresAt?: string;
};

interface StudentFormTQProps {
  type: "create" | "update";
  data?: Student;
  setOpen: (open: boolean) => void;
  relatedData?: {
    classes?: { id: number; name: string }[];
    grades?: { id: number; name: string; level?: string }[];
    parents?: { id: string; name: string; surname: string }[];
  };
}

const StudentFormTQ = ({
  type,
  data,
  setOpen,
  relatedData
}: StudentFormTQProps) => {

  //Depuracion para ver que datos estamos recibiendo:
  console.log("StudentFormTQ - Tipo:", type);
  console.log("StudentFormTQ - Data recibida:", data);
  console.log("StudentFormTQ - RelatedData recibida:", relatedData);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      id: data?.id,
      username: data?.username || "",
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      password: type === "update" ? undefined : "",
      phone: data?.phone || "",
      address: data?.address || "",
      bloodType: data?.bloodType || "",
      sex: data?.sex as "MALE" | "FEMALE" | undefined,
      birthday: data?.birthday ? new Date(data.birthday) : undefined,
      classId: data?.classId ? String(data.classId) : "",
      gradeId: data?.gradeId ? String(data.gradeId) : "",
      // gradeId: data?.gradeId || 0,
      // classId: data?.classId || 0,
      parentId: data?.parentId || ""
    }
  });

  const [customError, setCustomError] = useState<string | null>(null);
  // Estado para manejar la imagen
  const [img, setImg] = useState<ImageInfo | null>(
    data?.img ? { url: data.img, path: data.imgPath } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utilizar los hooks de mutación de TanStack Query
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    try{
      setCustomError(null);
      setIsUploading(true);

      console.log('Formulario de datos antes del envio:', formData);

      //Validar los campos requeridos
      if(!formData.username || !formData.email || !formData.name || !formData.surname){
        setCustomError("Por favor, complete todos los campos requeridos.");
        setIsUploading(false);
        return;
      }
      
      // Convertir Date a string para birthday
      const formattedBirthday = formData.birthday?.toISOString().split("T")[0] || "";

      //Preparar los datos del estudiante
      const studentData = {
        username: formData.username.trim(),
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || '',
        bloodType: formData.bloodType?.trim() || '',
        sex: formData.sex || '',
        birthday: formData.birthday ? formData.birthday.toISOString().split("T")[0] : undefined,
        classId: parseInt(formData.classId, 10) || 0,
        gradeId: parseInt(formData.gradeId, 10) || 0,
        parentId: formData.parentId || undefined,
        img: img?.url || undefined,
        imgPath: img?.path || undefined,
      } as const;

      console.log('Datos para el envio:', studentData);
      
      if (type === "create") {
        console.log('Enviando datos para crear estudiante:', studentData);
        createMutation.mutate({
          ...studentData,
          password: formData.password || ''
      }, {
        onSuccess: () => {
          toast.success("Estudiante creado correctamente");
          reset();
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          setIsUploading(false);
        }
      });
    } else if (type === 'update' && data?.id) {
      updateMutation.mutate({
        ...studentData,
        id: data.id,
        password: formData.password || undefined // Si no se proporciona una nueva contraseña, se mantiene la actual
      }, {
        onSuccess: () => {
          toast.success("Estudiante actualizado correctamente");
          setOpen(false);
          router.refresh();
          setIsUploading(false);
        },
        onError: (error) => {
          console.error('Error al actualizar el estudiante:', error);
          setCustomError(error.message);
          setIsUploading(false);
        }
      });
    }
  } catch (error) {
    console.error('Error al enviar el formulario:', error);
    setCustomError((error as Error).message);
      setIsUploading(false);
  }
  });

  // Función para manejar la carga de imágenes con Google Cloud Storage
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      
      // Enviar el archivo al endpoint de carga
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar la imagen');
      }
      
      // Ahora recibimos más información de la API, incluida la ruta y la fecha de expiración
      const { url, path, expiresAt } = await response.json();
      setImg({ url, path, expiresAt });
    } catch (error) {
      console.error('Error cargando imagen:', error);
      toast.error('Error al cargar la imagen. Por favor, intenta nuevamente.');
    } finally {
      setIsUploading(false);
    }
  };

  // Determinar si está cargando
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form className="flex flex-col gap-4 sm:gap-6 w-full" onSubmit={onSubmit}>
      {/* Encabezado del formulario con gradiente mejorado */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 sm:p-6 rounded-t-xl shadow-md relative overflow-hidden w-full">
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
          <span className="truncate">{type === "create" ? "Crear un nuevo estudiante" : "Actualizar el estudiante"}</span>
        </h1>
        <p className="text-white/80 mt-2 ml-10 sm:ml-12 text-sm sm:text-base max-w-3xl">
          Complete la información a continuación para {type === "create" ? "registrar un nuevo estudiante en el sistema" : "actualizar los datos del estudiante seleccionado"}
        </p>
      </div>
      
      {/* Container principal con efecto de sombra y bordes redondeados */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative w-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        {/* Sección de autenticación */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 sm:hidden">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 hidden sm:block lg:hidden">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 hidden lg:block">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Correo electrónico *"
                name="email"
                defaultValue={data?.email}
                register={register}
                error={errors?.email}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label={type === "create" ? "Contraseña *" : "Contraseña (dejar en blanco para mantener)"}
                name="password"
                type="password"
                register={register}
                error={errors?.password}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      
        {/* Sección de información personal */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-purple-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 sm:hidden">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 hidden sm:block lg:hidden">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 hidden lg:block">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg lg:text-xl">Información personal</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Nombre *"
                name="name"
                defaultValue={data?.name}
                register={register}
                error={errors.name}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
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
                error={errors.surname}
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
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Teléfono"
                name="phone"
                defaultValue={data?.phone}
                register={register}
                error={errors.phone}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Dirección *"
                name="address"
                defaultValue={data?.address}
                register={register}
                error={errors.address}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                }
              />
            </div>
          
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Tipo de sangre *"
                name="bloodType"
                defaultValue={data?.bloodType}
                register={register}
                error={errors.bloodType}
                className="bg-gray-50 focus:bg-white"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M18 3 12 9 6 3H3v3l6 6-6 6v3h3l6-6 6 6h3v-3l-6-6 6-6V3h-3Z"></path>
                  </svg>
                }
              />
            </div>
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <InputField
                label="Fecha de nacimiento *"
                name="birthday"
                defaultValue={data?.birthday?.toString()?.split("T")[0]}
                register={register}
                error={errors.birthday}
                type="date"
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
            
            <div className="flex flex-col gap-2 transform transition-all duration-300 hover:-translate-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="22 11 16 15 14 13"></polyline>
                </svg>
                Sexo <span className="text-pink-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                {...register("sex")}
                defaultValue={data?.sex}
              >
                <option value="">Seleccionar sexo</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
              </select>
              {errors.sex?.message && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors.sex.message.toString()}
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-2 transform transition-all duration-300 hover:-translate-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                Clase <span className="text-pink-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                {...register("classId")}
                defaultValue={data?.classId ? data.classId.toString() : ''}
              >
                <option value="">Seleccionar clase</option>
                {relatedData?.classes && relatedData.classes.length > 0 ? (
                  relatedData.classes.map((classItem) => (
                  <option value={classItem.id.toString()} key={classItem.id}>
                    {classItem.name}
                  </option>
                ))
                ) : (
                <option disabled>No hay clases disponibles</option>
              )}
              </select>
              {errors.classId?.message && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors.classId.message.toString()}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="flex flex-col gap-2 transform transition-all duration-300 hover:-translate-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
                Grado <span className="text-pink-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                {...register("gradeId")}
                defaultValue={data?.gradeId ? data.gradeId.toString(): ''}
              >
                <option value="">Seleccionar grado</option>
                {relatedData?.grades && relatedData.grades.length > 0 ? (
                  relatedData.grades.map((grade) => (
                  <option value={grade.id.toString()} key={grade.id}>
                    {grade.name || grade.level}
                  </option>
                  ))
                ) : (
                <option disabled>No hay grados disponibles</option>
              )}
              </select>
              {errors.gradeId?.message && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors.gradeId.message.toString()}
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-2 transform transition-all duration-300 hover:-translate-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Padre/Tutor <span className="text-pink-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 bg-gray-50 focus:bg-white"
                {...register("parentId")}
                defaultValue={data?.parentId}
              >
                <option value="">Seleccionar padre/tutor</option>
                {relatedData?.parents?.map((parent) => (
                  <option value={parent.id} key={parent.id}>
                    {parent.name} {parent.surname}
                  </option>
                ))}
              </select>
              {errors.parentId?.message && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors.parentId.message.toString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sección de fotografía */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 border-t border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-full bg-pink-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg">Fotografía</span>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 transition-all hover:border-indigo-400 max-w-xs mx-auto">
            {img ? (
              <div className="relative w-full pt-[100%] overflow-hidden rounded-lg shadow-md mb-3">
                <Image 
                  src={img.url} 
                  alt="Foto del estudiante" 
                  fill
                  className="object-cover absolute inset-0"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-48 bg-gray-100 rounded-lg mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 w-full"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Subiendo...</span>
                </>
              ) : img ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Cambiar imagen</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Subir imagen</span>
                </>
              )}
            </button>
            {img?.expiresAt && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                URL válida hasta: {new Date(img.expiresAt).toLocaleDateString()}
              </p>
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
              {type === "create" ? "Crear estudiante" : "Actualizar estudiante"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default StudentFormTQ; 