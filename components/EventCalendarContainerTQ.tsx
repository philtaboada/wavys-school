'use client';

import Image from "next/image";
import EventCalendar from "./EventCalendar";
import EventListTQ from "./EventListTQ";

interface EventCalendarContainerTQProps {
  searchParams: { [keys: string]: string | undefined };
}

export default function EventCalendarContainerTQ({ searchParams }: EventCalendarContainerTQProps) {
  const { date } = searchParams;
  
  return (
    <div className="bg-white p-4 rounded-md">
      <EventCalendar />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4">Eventos</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4">
        <EventListTQ dateParam={date} />
      </div>
    </div>
  );
} 