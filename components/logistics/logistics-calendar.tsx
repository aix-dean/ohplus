"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"

// Sample logistics events data
const sampleEvents = [
  { id: "SA-001934", type: "CMG", date: 8, color: "bg-blue-500" },
  { id: "SA-005809", type: "MAI", date: 10, color: "bg-green-500" },
  { id: "SA-002053", type: "REP", date: 13, color: "bg-purple-500" },
  { id: "SA-005366", type: "STRETCH", date: 17, color: "bg-cyan-500" },
  { id: "SA-007361", type: "MP", date: 21, color: "bg-orange-500" },
  { id: "SA-007732", type: "PEL", date: 23, color: "bg-red-500" },
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

const dayHeaders = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

export function LogisticsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(4) // May = 4 (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025)
  const [saType, setSaType] = useState("")
  const [sites, setSites] = useState("")

  // Get days in month and starting day
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  // Create calendar grid
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const getEventsForDay = (day: number) => {
    return sampleEvents.filter((event) => event.date === day)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} className="p-1">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold">
              {months[currentMonth]} {currentYear}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>

          <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} className="p-1">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={saType} onValueChange={setSaType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="-SA Type-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CMG">CMG</SelectItem>
              <SelectItem value="MAI">MAI</SelectItem>
              <SelectItem value="REP">REP</SelectItem>
              <SelectItem value="STRETCH">STRETCH</SelectItem>
              <SelectItem value="MP">MP</SelectItem>
              <SelectItem value="PEL">PEL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sites} onValueChange={setSites}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="-All sites-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="site1">Site 1</SelectItem>
              <SelectItem value="site2">Site 2</SelectItem>
              <SelectItem value="site3">Site 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Day Headers */}
      {/* Days of week header */}
      <div className="grid grid-cols-7 border-2 border-blue-400 rounded-t-md">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-l border-r border-b border-gray-200">
        {calendarDays.map((day, index) => (
          <div key={index} className="min-h-[100px] p-2 border-r border-b border-gray-200 last:border-r-0">
            {day && (
              <>
                <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                <div className="space-y-1">
                  {getEventsForDay(day).map((event) => (
                    <div
                      key={event.id}
                      className={`${event.color} text-white text-xs px-2 py-1 rounded text-center font-medium`}
                    >
                      {event.id}: {event.type}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
