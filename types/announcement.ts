export interface Announcement {
  id: number;
  title: string;
  description: string;
  date: string;
  read: boolean;
  classId: string | null;
  type: 'announcement' | 'alert';
}

export interface AnnouncementState {
  announcements: Announcement[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}
