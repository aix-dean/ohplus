"use client"

import { LogisticsCalendar } from "@/components/logistics/logistics-calendar"

export default function LogisticsCalendarPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Logistics Calendar</h1>
      </div>
      <LogisticsCalendar />
    </div>
  )
}
