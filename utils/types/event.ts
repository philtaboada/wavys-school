export type Event = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  classId?: string;
  class?: {
    id: string;
    name: string;
  };
};