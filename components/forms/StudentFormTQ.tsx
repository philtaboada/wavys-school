'use client';

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useCreateStudent, useUpdateStudent } from "@/utils/queries/studentQueries";
import { Student } from "@/utils/types/student";

interface StudentFormTQProps {
  type: "create" | "update";
  data?: Student;
  setOpen: (open: boolean) => void;
  relatedData?: {
    classes?: { id: number; name: string }[];
    grades?: { id: number; name: string }[];
    parents?: { id: string; name: string; surname: string }[];
  };
}

const StudentFormTQ = ({
  type,
  data,
  setOpen,
  relatedData,
}: StudentFormTQProps) => {
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
      gradeId: data?.gradeId || 0,
      classId: data?.classId || 0,
      parentId: data?.parentId || ""
    }
  });

  const [customError, setCustomError] = useState<string | null>(null);

  // Utilizar los hooks de mutación de TanStack Query
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    setCustomError(null);
    
    // Convertir Date a string para birthday
    const formattedBirthday = formData.birthday?.toISOString().split("T")[0] || "";

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
        birthday: formattedBirthday,
        gradeId: formData.gradeId,
        classId: formData.classId,
        parentId: formData.parentId
      }, {
        onSuccess: () => {
          toast.success("Estudiante creado correctamente");
          reset();
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al crear el estudiante");
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
        birthday: formattedBirthday,
        gradeId: formData.gradeId,
        classId: formData.classId,
        parentId: formData.parentId
      }, {
        onSuccess: () => {
          toast.success("Estudiante actualizado correctamente");
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al actualizar el estudiante");
        }
      });
    }
  });

  // Determinar si está cargando
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form className="flex flex-col gap-6 max-w-4xl mx-auto" onSubmit={onSubmit}>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-lg">
        <h1 className="text-xl font-semibold text-white">
          {type === "create" ? "Crear un nuevo estudiante" : "Actualizar el estudiante"}
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
              defaultValue={data?.birthday?.toString()?.split("T")[0]}
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
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
            <label className="text-sm font-medium text-gray-700">Clase *</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500 focus:ring-2 focus:outline-none transition duration-200"
              {...register("classId", { valueAsNumber: true })}
              defaultValue={data?.classId}
            >
              <option value="">Seleccionar clase</option>
              {relatedData?.classes?.map((classItem) => (
                <option value={classItem.id} key={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
            {errors.classId?.message && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {errors.classId.message.toString()}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Grado *</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500 focus:ring-2 focus:outline-none transition duration-200"
              {...register("gradeId", { valueAsNumber: true })}
              defaultValue={data?.gradeId}
            >
              <option value="">Seleccionar grado</option>
              {relatedData?.grades?.map((grade) => (
                <option value={grade.id} key={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
            {errors.gradeId?.message && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {errors.gradeId.message.toString()}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Padre/Tutor *</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500 focus:ring-2 focus:outline-none transition duration-200"
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
              {type === "create" ? "Crear estudiante" : "Actualizar estudiante"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default StudentFormTQ; 