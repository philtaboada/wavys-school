import { useSupabaseQuery } from '@/utils/queries/useSupabaseQuery';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Announcement, AnnouncementState } from '@/types/announcement';

export const useAnnouncements = (): AnnouncementState => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [isClassIdsLoaded, setIsClassIdsLoaded] = useState(false);

  console.log('Component mounted/updated');


  // Obtener información del usuario
  useEffect(() => {
    const fetchUserInfo = async () => {
      console.log('Fetching user info...');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('User found');
        console.log('User metadata:', user.user_metadata);
        setUserId(user.id);
        setUserRole((user.user_metadata as { role?: string })?.role || null);
      } else {
        console.log('No user found');
      }
    };
    
    fetchUserInfo();
  }, []);

  // Get class IDs based on user role
  useEffect(() => {
    const fetchClassIds = async () => {
      console.log('Fetching class IDs for role:', userRole);
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

  // Get announcements using Tanstack Query
  const { data: announcements, error, isLoading } = useSupabaseQuery<Announcement[]>(
    ['announcements', userRole, classIds],
    async (supabase) => {
      console.log('Current user role:', userRole);
      console.log('Class IDs:', classIds);

      let query = supabase
        .from('Announcement')
        .select(`
          *,
          announcement_reads!left(read_at, user_id)
        `)
        .order('date', { ascending: false })
        .limit(6);

      // Filter by user_id
      if (userId) {
        query = query.eq('announcement_reads.user_id', userId);
      }

      // Filter by classes if not admin
      if (userRole !== 'admin') {
        if (classIds.length > 0) {
          console.log('Filtering by classes:', classIds);
          query = query.or(`classId.is.null,classId.in.(${classIds.join(',')})`);
        } else {
          console.log('No class IDs found, showing only global announcements');
          query = query.is('classId', null);
        }
      } else {
        console.log('Admin user, showing all announcements');
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Error al obtener anuncios: ${error.message}`);
      }

      console.log('Announcements fetched:', data?.length || 0);
      return data || [];
    },
    {
      enabled: Boolean(userId) && isClassIdsLoaded
    }
  );

  const unreadCount = (announcements || []).filter(a => !a.read).length;

  return {
    announcements: announcements || [],
    unreadCount,
    loading: isLoading,
    error: error ? error.message : null
  };
};
