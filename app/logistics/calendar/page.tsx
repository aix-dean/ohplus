import LogisticsCalendar from "@/components/logistics/logistics-calendar"

export default function LogisticsCalendarPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Logistics Calendar</h1>
        <p className="text-gray-600">View and manage service assignments</p>
      </div>
      <LogisticsCalendar />
    </div>
  )
}
