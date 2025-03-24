"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

const TeacherForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
    mode: "onChange"
  });

  const [img, setImg] = useState<any>(data?.img ? { secure_url: data.img } : null);

  const [state, formAction] = useFormState(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction({ ...data, img: img?.secure_url });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Profesor ${type === "create" ? "creado" : "actualizado"} exitosamente`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Ha ocurrido un error. Por favor, intenta nuevamente.");
    }
  }, [state, router, type, setOpen]);

  const { subjects } = relatedData;

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
              defaultValue={data?.username}
              register={register}
              error={errors?.username}
            />
          </div>
          <div>
            <InputField
              label="Correo electrónico *"
              name="email"
              defaultValue={data?.email}
              register={register}
              error={errors?.email}
            />
          </div>
          <div>
            <InputField
              label={type === "create" ? "Contraseña *" : "Contraseña (dejar en blanco para mantener)"}
              name="password"
              type="password"
              defaultValue={data?.password}
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
              defaultValue={data?.name}
              register={register}
              error={errors.name}
            />
          </div>
          <div>
            <InputField
              label="Apellido *"
              name="surname"
              defaultValue={data?.surname}
              register={register}
              error={errors.surname}
            />
          </div>
          <div>
            <InputField
              label="Teléfono"
              name="phone"
              defaultValue={data?.phone}
              register={register}
              error={errors.phone}
            />
          </div>
          <div>
            <InputField
              label="Dirección *"
              name="address"
              defaultValue={data?.address}
              register={register}
              error={errors.address}
            />
          </div>
          <div>
            <InputField
              label="Tipo de sangre *"
              name="bloodType"
              defaultValue={data?.bloodType}
              register={register}
              error={errors.bloodType}
            />
          </div>
          <div>
            <InputField
              label="Fecha de nacimiento *"
              name="birthday"
              defaultValue={data?.birthday?.toISOString?.()?.split("T")[0]}
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
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Asignaturas</label>
            <select
              multiple
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500 focus:ring-2 focus:outline-none transition duration-200 min-h-[100px]"
              {...register("subjects")}
              defaultValue={data?.subjects?.map((s: any) => s.id?.toString() || s)}
            >
              {subjects.map((subject: { id: number; name: string }) => (
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
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
            {img?.secure_url ? (
              <Image 
                src={img.secure_url} 
                alt="Foto de perfil" 
                width={64} 
                height={64} 
                className="w-full h-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            )}
          </div>
          
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            onSuccess={(result, { widget }) => {
              setImg(result.info);
              widget.close();
            }}
          >
            {({ open }) => (
              <button 
                type="button"
                className="py-2 px-4 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                onClick={() => open()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Subir foto de perfil
              </button>
            )}
          </CldUploadWidget>
        </div>
      </div>
      
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente.</span>
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
              {type === "create" ? "Crear profesor" : "Actualizar profesor"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;
