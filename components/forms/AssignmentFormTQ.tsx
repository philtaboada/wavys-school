'use client';

import { useState, useEffect } from "react";
import { useCreateAssignment, useUpdateAssignment } from "@/utils/queries/assignmentQueries";
import { Assignment } from "@/utils/types/assignment";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// Propiedades para el formulario
interface AssignmentFormTQProps {
  type: "create" | "update";
  data?: Assignment;
  setOpen: (open: boolean) => void;
  relatedData: {
    lessons?: {
      id: number;
      name: string;
      subject?: {
        id: number;
        name: string;
      };
    }[];
  };
}

export default function AssignmentFormTQ({ 
  type, 
  data, 
  setOpen, 
  relatedData 
}: AssignmentFormTQProps) {
  const isUpdateMode = type === "update";
  
  // Configurar estado del formulario
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    dueDate: "",
    lessonId: 0
  });
  
  // Manejar mutaciones
  const createAssignmentMutation = useCreateAssignment();
  const updateAssignmentMutation = useUpdateAssignment();
  const router = useRouter();

  // Cargar datos existentes si es una actualización
  useEffect(() => {
    if (isUpdateMode && data) {
      setFormData({
        title: data.title,
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "",
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "",
        lessonId: data.lessonId
      });
    }
  }, [isUpdateMode, data]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "lessonId" ? parseInt(value) : value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    if (!formData.title || !formData.lessonId) {
      toast.error("Por favor, completa los campos obligatorios");
      return;
    }

    // Crear o actualizar según el modo
    if (isUpdateMode && data) {
      updateAssignmentMutation.mutate({
        id: data.id,
        title: formData.title,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        lessonId: formData.lessonId
      }, {
        onSuccess: () => {
          toast.success("Tarea actualizada exitosamente");
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          toast.error(`Error al actualizar tarea: ${error.message}`);
        }
      });
    } else {
      createAssignmentMutation.mutate({
        title: formData.title,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        lessonId: formData.lessonId
      }, {
        onSuccess: () => {
          toast.success("Tarea creada exitosamente");
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          toast.error(`Error al crear tarea: ${error.message}`);
        }
      });
    }
  };

  // Renderizar formulario
  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h2 className="text-xl font-bold">
        {isUpdateMode ? "Actualizar Tarea" : "Crear Nueva Tarea"}
      </h2>
      
      {/* Título */}
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="font-medium">
          Título*
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="p-2 border rounded"
          placeholder="Título de la tarea"
          required
        />
      </div>
      
      {/* Fecha de inicio */}
      <div className="flex flex-col gap-2">
        <label htmlFor="startDate" className="font-medium">
          Fecha de inicio
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="p-2 border rounded"
        />
      </div>
      
      {/* Fecha de entrega */}
      <div className="flex flex-col gap-2">
        <label htmlFor="dueDate" className="font-medium">
          Fecha de entrega
        </label>
        <input
          type="date"
          id="dueDate"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          className="p-2 border rounded"
        />
      </div>
      
      {/* Lección */}
      <div className="flex flex-col gap-2">
        <label htmlFor="lessonId" className="font-medium">
          Lección*
        </label>
        <select
          id="lessonId"
          name="lessonId"
          value={formData.lessonId}
          onChange={handleChange}
          className="p-2 border rounded"
          required
        >
          <option value="">Selecciona una lección</option>
          {relatedData.lessons?.map(lesson => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.subject?.name ? `${lesson.subject.name}: ${lesson.name}` : lesson.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Botones de acción */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 border rounded"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
        >
          {(createAssignmentMutation.isPending || updateAssignmentMutation.isPending) 
            ? "Guardando..." 
            : isUpdateMode ? "Actualizar" : "Crear"}
        </button>
      </div>
    </form>
  );
} 