import { Suspense } from "react"
import { LogisticsCalendar } from "@/components/logistics/logistics-calendar"

export default function LogisticsCalendarPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Logistics Calendar</h1>
        <p className="text-gray-600 mt-1">View and manage logistics assignments and schedules</p>
      </div>

      <Suspense fallback={<div>Loading calendar...</div>}>
        <LogisticsCalendar />
      </Suspense>
    </div>
  )
}
