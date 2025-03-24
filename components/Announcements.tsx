import { createClient } from "@/utils/supabase/server";

const Announcements = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id;
  const role = (user?.user_metadata as { role?: string })?.role;

  // Obtener clases relacionadas al usuario según su rol
  let classIds: string[] = [];
  
  if (role !== 'admin') {
    let classQuery;
    
    if (role === 'teacher') {
      const { data: classes } = await supabase
        .from('lessons')
        .select('classId')
        .eq('teacherId', userId);
      
      classIds = classes?.map(c => c.classId) || [];
    } else if (role === 'student') {
      const { data: classes } = await supabase
        .from('students')
        .select('classId')
        .eq('id', userId);
      
      classIds = classes?.map(c => c.classId) || [];
    } else if (role === 'parent') {
      const { data: classes } = await supabase
        .from('students')
        .select('classId')
        .eq('parentId', userId);
      
      classIds = classes?.map(c => c.classId) || [];
    }
  }

  // Consultar anuncios
  let query = supabase
    .from('announcement')
    .select('*')
    .order('date', { ascending: false })
    .limit(3);

  // Filtrar por clases si no es admin
  if (role !== 'admin' && classIds.length > 0) {
    query = query.or(`classId.is.null,classId.in.(${classIds.join(',')})`);
  } else if (role !== 'admin') {
    query = query.is('classId', null);
  }

  const { data } = await query;

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <span className="text-xs text-gray-400">Ver todos</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data && data[0] && (
          <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[0].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(data[0].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[0].description}</p>
          </div>
        )}
        {data && data[1] && (
          <div className="bg-lamaPurpleLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[1].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(data[1].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[1].description}</p>
          </div>
        )}
        {data && data[2] && (
          <div className="bg-lamaYellowLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[2].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(data[2].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[2].description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
