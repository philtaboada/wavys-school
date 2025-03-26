"use client";

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useCreateTeacher, useUpdateTeacher } from "@/utils/queries/teacherQueries";
import { Teacher } from "@/utils/types";

// Tipo para la imagen con información adicional de la URL firmada
type ImageInfo = {
  url: string;
  path?: string;
  expiresAt?: string;
};

interface TeacherFormTQProps {
  type: "create" | "update";
  data?: Teacher;
  setOpen: (open: boolean) => void;
  relatedData?: {
    subjects?: { id: number; name: string }[];
  };
}

const TeacherFormTQ = ({
  type,
  data,
  setOpen,
  relatedData,
}: TeacherFormTQProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
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
      subjects: data?.subjects?.map(s => s.id.toString()) || []
    }
  });

  // Inicializar estado de imagen con la información de la imagen existente
  const [img, setImg] = useState<ImageInfo | null>(
    data?.img ? { url: data.img, path: data.imgPath } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utilizar los hooks de mutación de TanStack Query
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    setCustomError(null);

    // Para la creación, convertimos los IDs de string a number
    const numericSubjects = formData.subjects?.map(id => parseInt(id, 10));

    if (type === "create") {
      createMutation.mutate({
        username: formData.username,
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password || "",
        phone: formData.phone,
        address: formData.address || "",
        bloodType: formData.bloodType || "",
        sex: formData.sex || "",
        birthday: formData.birthday?.toISOString().split("T")[0] || "",
        subjects: numericSubjects,
        img: img?.url,
        imgPath: img?.path
      }, {
        onSuccess: () => {
          toast.success("Profesor creado correctamente");
          reset();
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al crear el profesor");
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
        bloodType: formData.bloodType,
        sex: formData.sex,
        birthday: formData.birthday?.toISOString().split("T")[0],
        subjects: numericSubjects,
        img: img?.url,
        imgPath: img?.path
      }, {
        onSuccess: () => {
          toast.success("Profesor actualizado correctamente");
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al actualizar el profesor");
        }
      });
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
  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <form className="flex flex-col gap-6 max-w-4xl mx-auto" onSubmit={onSubmit}>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-lg">
        <h1 className="text-xl font-semibold text-white">
          {type === "create" ? "Crear un nuevo profesor" : "Actualizar el profesor"}
        </h1>
      </div>
      
      {/* Sección de autenticación */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span className="font-medium text-gray-700">Información de autenticación</span>
        </div>
        <p className="text-xs text-gray-500 mb-5">Los campos con * son obligatorios</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <InputField
              label="Nombre de usuario *"
              name="username"
              register={register}
              error={errors?.username}
            />
          </div>
          <div>
            <InputField
              label="Correo electrónico *"
              name="email"
              register={register}
              error={errors?.email}
            />
          </div>
          <div>
            <InputField
              label={type === "create" ? "Contraseña *" : "Contraseña (dejar en blanco para mantener)"}
              name="password"
              type="password"
              register={register}
              error={errors?.password}
            />
          </div>
        </div>
      </div>
      
      {/* Sección de información personal */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <span className="font-medium text-gray-700">Información personal</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div>
            <InputField
              label="Nombre *"
              name="name"
              register={register}
              error={errors.name}
            />
          </div>
          <div>
            <InputField
              label="Apellido *"
              name="surname"
              register={register}
              error={errors.surname}
            />
          </div>
          <div>
            <InputField
              label="Teléfono"
              name="phone"
              register={register}
              error={errors.phone}
            />
          </div>
          <div>
            <InputField
              label="Dirección *"
              name="address"
              register={register}
              error={errors.address}
            />
          </div>
          <div>
            <InputField
              label="Tipo de sangre *"
              name="bloodType"
              register={register}
              error={errors.bloodType}
            />
          </div>
          <div>
            <InputField
              label="Fecha de nacimiento *"
              name="birthday"
              register={register}
              error={errors.birthday}
              type="date"
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Sexo *</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500 focus:ring-2 focus:outline-none transition duration-200"
              {...register("sex")}
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
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Asignaturas</label>
            <select
              multiple
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500 focus:ring-2 focus:outline-none transition duration-200 min-h-[100px]"
              {...register("subjects")}
            >
              {relatedData?.subjects?.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Mantén presionado CTRL para seleccionar múltiples asignaturas</p>
            {errors.subjects?.message && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {errors.subjects.message.toString()}
              </p>
            )}
          </div>
        </div>
        
        {/* Foto de perfil - Componente para GCS con URLs firmadas */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
            {img?.url ? (
              <Image 
                src={img.url} 
                alt="Foto de perfil" 
                width={64} 
                height={64} 
                className="w-full h-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button 
              type="button"
              className="py-2 px-4 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Subir foto de perfil
                </>
              )}
            </button>
            
            {img?.expiresAt && (
              <p className="text-xs text-gray-500">
                URL válida hasta: {new Date(img.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Mostrar error personalizado si existe */}
      {customError && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{customError}</span>
        </div>
      )}
      
      <div className="flex gap-4 justify-end mt-4 pb-2">
        <button 
          type="button" 
          className="py-3 px-6 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors font-medium text-base shadow-sm hover:shadow"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="py-3 px-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-medium text-base shadow-sm hover:shadow-md disabled:opacity-70 disabled:pointer-events-none min-w-[150px]"
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
              {type === "create" ? "Crear profesor" : "Actualizar profesor"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TeacherFormTQ; 