"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  announcementSchema,
  AnnouncementSchema,
} from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  useCreateAnnouncement,
  useUpdateAnnouncement
} from "@/utils/queries/announcementQueries";
import { Announcement } from "@/utils/types";

interface AnnouncementFormProps {
  type: "create" | "update";
  data?: Announcement;
  setOpen: (open: boolean) => void;
  relatedData?: {
    classes?: { id: number; name: string }[];
  };
}

const AnnouncementForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: AnnouncementFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      id: data?.id,
      title: data?.title || "",
      description: data?.description || "",
      date: data?.date ? new Date(data.date) : new Date(),
      classId: data?.classId || undefined,
    }
  });

  // Estado para errores personalizados
  const [customError, setCustomError] = useState<string | null>(null);

  // Utilizar los hooks de mutación de TanStack Query
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    setCustomError(null);

    if (type === "create") {
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        classId: formData.classId || undefined,
      }, {
        onSuccess: () => {
          toast.success("Anuncio creado correctamente");
          reset();
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al crear el anuncio");
        }
      });
    } else if (formData.id) {
      updateMutation.mutate({
        id: formData.id,
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        classId: formData.classId || undefined,
      }, {
        onSuccess: () => {
          toast.success("Anuncio actualizado correctamente");
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          setCustomError(error.message);
          toast.error("Error al actualizar el anuncio");
        }
      });
    }
  });

  // Determinar si está cargando
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form className="m-4 flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Crear un nuevo anuncio" : "Actualizar el anuncio"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Título"
          name="title"
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Descripción"
          name="description"
          register={register}
          error={errors?.description}
          textarea
        />
        <InputField
          label="Fecha"
          name="date"
          register={register}
          error={errors?.date}
          type="datetime-local"
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Clase (opcional)</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
          >
            <option value="">Sin clase específica</option>
            {relatedData?.classes?.map((classItem) => (
              <option value={classItem.id} key={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>
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
          ? (type === "create" ? "Creando..." : "Actualizando...") 
          : (type === "create" ? "Crear" : "Actualizar")}
      </button>
    </form>
  );
};

export default AnnouncementForm; 