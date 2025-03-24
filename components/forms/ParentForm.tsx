"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect } from "react";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createParent, updateParent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const ParentForm = ({
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
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
    mode: "onChange"
  });

  const [state, formAction] = useFormState(
    type === "create" ? createParent : updateParent,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Padre ${type === "create" ? "creado" : "actualizado"} exitosamente`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Ha ocurrido un error. Por favor, intenta nuevamente.");
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-6 max-w-4xl mx-auto" onSubmit={onSubmit}>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-lg">
        <h1 className="text-xl font-semibold text-white">
          {type === "create" ? "Crear un nuevo padre" : "Actualizar el padre"}
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
          <div className="md:col-span-1">
            <InputField
              label="Nombre de usuario *"
              name="username"
              defaultValue={data?.username}
              register={register}
              error={errors?.username}
            />
          </div>
          <div className="md:col-span-1">
            <InputField
              label="Correo electrónico"
              name="email"
              defaultValue={data?.email}
              register={register}
              error={errors?.email}
            />
          </div>
          <div className="md:col-span-1">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
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
              label="Teléfono *"
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
        
        {data?.students?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Estudiantes asociados:</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <ul className="list-disc pl-5 text-sm text-gray-600">
                {data.students.map((student: any) => (
                  <li key={student.id}>
                    {student.name} {student.surname}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
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
              {type === "create" ? "Crear padre" : "Actualizar padre"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ParentForm; 