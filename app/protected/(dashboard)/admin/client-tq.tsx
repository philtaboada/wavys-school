'use client';

import UserCardTQ from "@/components/UserCardTQ";
import AttendanceChartContainerTQ from "@/components/AttendanceChartContainerTQ";
import CountChartContainerTQ from "@/components/CountChartContainerTQ";
import EventCalendarContainerTQ from "@/components/EventCalendarContainerTQ";
import FinanceChartTQ from "@/components/FinanceChartTQ";
import AnnouncementsTQ from "@/components/AnnouncementsTQ";

interface AdminPageTQProps {
  searchParams: { [keys: string]: string | undefined };
}

export default function AdminPageTQ({ searchParams }: AdminPageTQProps) {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCardTQ type="Admin" />
          <UserCardTQ type="Teacher" />
          <UserCardTQ type="Student" />
          <UserCardTQ type="Parent" />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainerTQ />
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChartContainerTQ />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="w-full h-[500px]">
          <FinanceChartTQ />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainerTQ searchParams={searchParams}/>
        <AnnouncementsTQ />
      </div>
    </div>
  );
} 