import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Card from "@/components/card";

export default async function Home() {
  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-4">Next steps</h2>
        {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Cards para diferentes secciones */}
          <Card
            title="Listado de Estudiantes"
            description="Ver todos los estudiantes matriculados en el centro."
            href="/students"
          />
          <Card
            title="Gestión de Asistencia"
            description="Control de asistencia para profesores y padres."
            href="/attendance"
          />
          <Card
            title="Calificaciones"
            description="Consulta las calificaciones de los estudiantes."
            href="/grades"
          />
          <Card
            title="Horarios"
            description="Consulta los horarios de las clases."
            href="/schedules"
          />
          <Card
            title="Notificaciones"
            description="Recibe notificaciones importantes."
            href="/notifications"
          />
          <Card
            title="TanStack Query - Ejemplo"
            description="Ejemplo de integración con Supabase."
            href="/examples/attendance"
          />
        </div>
      </main>
    </>
  );
}
