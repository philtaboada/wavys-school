'use client';

import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Announcement {
  id: number;
  title: string;
  description: string;
  date: string;
  classId: string | null;
}

const useAnnouncements = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [isClassIdsLoaded, setIsClassIdsLoaded] = useState(false);

  // Obtener información del usuario
  useEffect(() => {
    const fetchUserInfo = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        setUserRole((user.user_metadata as { role?: string })?.role || null);
      }
    };
    
    fetchUserInfo();
  }, []);

  // Obtener clases relacionadas según el rol
  useEffect(() => {
    const fetchClassIds = async () => {
      if (!userId || !userRole || userRole === 'admin') {
        setIsClassIdsLoaded(true);
        return;
      }

      const supabase = createClient();
      let classIds: string[] = [];
      
      if (userRole === 'teacher') {
        const { data: classes } = await supabase
          .from('Lesson')
          .select('classId')
          .eq('teacherId', userId);
        
        classIds = classes?.map(c => c.classId) || [];
      } else if (userRole === 'student') {
        const { data: classes } = await supabase
          .from('Student')
          .select('classId')
          .eq('id', userId);
        
        classIds = classes?.map(c => c.classId) || [];
      } else if (userRole === 'parent') {
        const { data: classes } = await supabase
          .from('Student')
          .select('classId')
          .eq('parentId', userId);
        
        classIds = classes?.map(c => c.classId) || [];
      }
      
      setClassIds(classIds);
      setIsClassIdsLoaded(true);
    };
    
    if (userId && userRole) {
      fetchClassIds();
    }
  }, [userId, userRole]);

  // Usar Tanstack Query para obtener los anuncios
  return useSupabaseQuery<Announcement[]>(
    ['announcements', userRole, classIds],
    async (supabase) => {
      let query = supabase
        .from('Announcement')
        .select('*')
        .order('date', { ascending: false })
        .limit(3);

      // Filtrar por clases si no es admin
      if (userRole !== 'admin' && classIds.length > 0) {
        query = query.or(`classId.is.null,classId.in.(${classIds.join(',')})`);
      } else if (userRole !== 'admin') {
        query = query.is('classId', null);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error al obtener anuncios: ${error.message}`);
      }
      
      return data as Announcement[];
    },
    {
      enabled: isClassIdsLoaded,
      staleTime: 1000 * 60 * 5 // 5 minutos
    }
  );
};

const AnnouncementsTQ = () => {
  const { data: announcements, isLoading, error } = useAnnouncements();

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-gray-100 animate-pulse h-24 rounded-md"></div>
          <div className="bg-gray-100 animate-pulse h-24 rounded-md"></div>
          <div className="bg-gray-100 animate-pulse h-24 rounded-md"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <div className="text-sm text-red-500 mt-2">Error al cargar anuncios</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <span className="text-xs text-gray-400">Ver todos</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {announcements && announcements[0] && (
          <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{announcements[0].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(announcements[0].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{announcements[0].description}</p>
          </div>
        )}
        {announcements && announcements[1] && (
          <div className="bg-lamaPurpleLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{announcements[1].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(announcements[1].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{announcements[1].description}</p>
          </div>
        )}
        {announcements && announcements[2] && (
          <div className="bg-lamaYellowLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{announcements[2].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(announcements[2].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{announcements[2].description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsTQ; 