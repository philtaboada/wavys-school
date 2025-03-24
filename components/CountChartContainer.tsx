import Image from "next/image";
import CountChart from "./CountChart";
import { createClient } from "@/utils/supabase/server";

const CountChartContainer = async () => {
  const supabase = await createClient();

  // Obtenemos el conteo de estudiantes masculinos
  const { count: boys, error: boysError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('sex', 'MALE');

  // Obtenemos el conteo de estudiantes femeninas
  const { count: girls, error: girlsError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('sex', 'FEMALE');

  // Valores predeterminados en caso de error
  const boysCount = boysError ? 0 : boys || 0;
  const girlsCount = girlsError ? 0 : girls || 0;

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Estudiantes</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <CountChart boys={boysCount} girls={girlsCount} />
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaSky rounded-full" />
          <h1 className="font-bold">{boysCount}</h1>
          <h2 className="text-xs text-gray-300">
            Hombres ({Math.round((boysCount / (boysCount + girlsCount || 1)) * 100)}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaYellow rounded-full" />
          <h1 className="font-bold">{girlsCount}</h1>
          <h2 className="text-xs text-gray-300">
            Mujeres ({Math.round((girlsCount / (boysCount + girlsCount || 1)) * 100)}%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default CountChartContainer;
