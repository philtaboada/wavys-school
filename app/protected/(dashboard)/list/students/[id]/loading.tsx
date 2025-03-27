export default function Loading() {
  return (
    <div className="flex-1 p-4 flex items-center justify-center">
      <div className="w-8 h-8 border-t-2 border-b-2 border-lamaBlue rounded-full animate-spin"></div>
      <span className="ml-2">Cargando detalles del estudiante...</span>
    </div>
  );
} 