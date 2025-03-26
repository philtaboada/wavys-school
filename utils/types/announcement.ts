export type Announcement = {
  id: number;
  title: string;
  description: string;
  date: string;
  classId?: number;
  Class?: {
    id: number;
    name: string;
    Grade?: {
      id: number;
      name: string;
    };
  };
};

export type AnnouncementListParams = {
  page: number;
  search?: string;
  classId?: number;
  startDate?: string;
  endDate?: string;
  global?: boolean; // Para filtrar anuncios globales (sin classId)
};

export type AnnouncementListResult = {
  data: Announcement[];
  count: number;
};

// Tipos para mutaciones
export type CreateAnnouncementParams = {
  title: string;
  description: string;
  date: string;
  classId?: number;
};

export type UpdateAnnouncementParams = {
  id: number;
  title?: string;
  description?: string;
  date?: string;
  classId?: number;
};
