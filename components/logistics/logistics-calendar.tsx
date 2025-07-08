"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"

// Sample logistics event data
const sampleLogisticsEvents = [
  { id: "SA-001934", type: "CMG", date: 8, color: "bg-blue-500", title: "SA-001934: CMG" },
  { id: "SA-005809", type: "MAI", date: 10, color: "bg-green-500", title: "SA-005809: MAI" },
  { id: "SA-002053", type: "REP", date: 13, color: "bg-purple-500", title: "SA-002053: REP" },
  { id: "SA-005366", type: "STRETCH", date: 17, color: "bg-cyan-500", title: "SA-005366: STRETCH" },
  { id: "SA-007361", type: "MP", date: 21, color: "bg-orange-500", title: "SA-007361: MP" },
  { id: "SA-007732", type: "PEL", date: 23, color: "bg-red-500", title: "SA-007732: PEL" },
]

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

export function LogisticsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(4) // May = 4 (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025)
  const [selectedType, setSelectedType] = useState("all")
  const [selectedSites, setSelectedSites] = useState("all")

  // Get the first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  // Create calendar grid
  const calendarDays = []

  // Previous month's trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isNextMonth: false,
    })
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isNextMonth: false,
    })
  }

  // Next month's leading days
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isNextMonth: true,
    })
  }

  const getEventsForDay = (day: number) => {
    return sampleLogisticsEvents.filter((event) => event.date === day)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Calendar Header - Updated to match the image */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Select
            value={`${currentMonth}-${currentYear}`}
            onValueChange={(value) => {
              const [month, year] = value.split("-")
              setCurrentMonth(Number.parseInt(month))
              setCurrentYear(Number.parseInt(year))
            }}
          >
            <SelectTrigger className="w-32 border-0 shadow-none text-lg font-semibold p-0 h-auto">
              <SelectValue />
              <ChevronDown className="h-4 w-4 ml-2" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={`${index}-${currentYear}`} value={`${index}-${currentYear}`}>
                  {month} {currentYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32 border border-gray-300">
              <SelectValue placeholder="-SA Type-" />
              <ChevronDown className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-SA Type-</SelectItem>
              <SelectItem value="cmg">CMG</SelectItem>
              <SelectItem value="mai">MAI</SelectItem>
              <SelectItem value="rep">REP</SelectItem>
              <SelectItem value="stretch">STRETCH</SelectItem>
              <SelectItem value="mp">MP</SelectItem>
              <SelectItem value="pel">PEL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSites} onValueChange={setSelectedSites}>
            <SelectTrigger className="w-32 border border-gray-300">
              <SelectValue placeholder="-All sites-" />
              <ChevronDown className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-All sites-</SelectItem>
              <SelectItem value="site1">Site 1</SelectItem>
              <SelectItem value="site2">Site 2</SelectItem>
              <SelectItem value="site3">Site 3</SelectItem>
              <SelectItem value="site4">Site 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week header with colored border as shown in image */}
        <div className="grid grid-cols-7 gap-1 mb-2 border-2 border-blue-400 rounded">
          {daysOfWeek.map((day) => (
            <div key={day} className="p-3 text-xs font-medium text-gray-600 text-center bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((calendarDay, index) => {
            const events = calendarDay.isCurrentMonth ? getEventsForDay(calendarDay.day) : []

            return (
              <div
                key={index}
                className={`
                  min-h-[96px] p-2 border border-gray-200 rounded-sm cursor-pointer
                  ${calendarDay.isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400"}
                `}
              >
                <div className="text-sm font-medium mb-1">{calendarDay.day}</div>

                {/* Events */}
                <div className="space-y-1">
                  {events.map((event) => (
                    <Badge
                      key={event.id}
                      className={`
                        ${event.color} text-white text-xs px-1 py-0.5 
                        block w-full text-center truncate cursor-pointer
                        hover:opacity-80 transition-opacity
                      `}
                      variant="secondary"
                      title={event.title}
                    >
                      {event.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
