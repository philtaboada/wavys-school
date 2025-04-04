import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';

export const useMarkAnnouncementAsRead = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    fetchUserId();
  }, []);
  const markAsRead = async (ids: number[]) => {
    if (!userId) return;
    const supabase = createClient();
    
    const { error } = await supabase
      .from('announcement_reads')
      .upsert(
        ids.map(id => ({
          announcement_id: id,
          user_id: userId,
          read_at: new Date().toISOString()
        }))
      );

    if (error) {
      console.error('Error marking announcements as read:', error);
      throw error;
    }
  };

  return { markAsRead };
};
