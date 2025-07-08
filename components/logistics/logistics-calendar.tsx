"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

// Sample logistics event data
const sampleEvents = [
  { id: "SA-001934", type: "CMG", date: 8, color: "bg-blue-500" },
  { id: "SA-005809", type: "MAI", date: 10, color: "bg-green-500" },
  { id: "SA-002053", type: "REP", date: 13, color: "bg-purple-500" },
  { id: "SA-005366", type: "STRETCH", date: 17, color: "bg-green-500" },
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

const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

export function LogisticsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4)) // May 2025
  const [saType, setSaType] = useState("")
  const [sites, setSites] = useState("")

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Create calendar grid
  const calendarDays = []

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventsForDay = (day: number) => {
    return sampleEvents.filter((event) => event.date === day)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Calendar Header - Updated to match the image */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} className="p-1 h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-1 bg-gray-50 px-3 py-2 rounded-md border">
            <span className="text-sm font-medium">
              {months[month]} {year}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>

          <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} className="p-1 h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={saType} onValueChange={setSaType}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="-SA Type-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cmg">CMG</SelectItem>
              <SelectItem value="mai">MAI</SelectItem>
              <SelectItem value="rep">REP</SelectItem>
              <SelectItem value="stretch">STRETCH</SelectItem>
              <SelectItem value="mp">MP</SelectItem>
              <SelectItem value="pel">PEL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sites} onValueChange={setSites}>
            <SelectTrigger className="w-32 h-9">
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

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week header with colored border as shown in image */}
        <div className="grid grid-cols-7 gap-1 mb-2 border-2 border-blue-400 rounded">
          {dayNames.map((day) => (
            <div key={day} className="p-3 text-xs font-medium text-gray-600 text-center bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const events = day ? getEventsForDay(day) : []

            return (
              <div
                key={index}
                className={`
                  min-h-[96px] p-2 border border-gray-200 rounded-sm cursor-pointer
                  ${day ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400"}
                `}
              >
                {day && (
                  <>
                    <div className="text-sm font-medium mb-1">{day}</div>

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
                          title={`${event.id}: ${event.type}`}
                        >
                          {event.id}: {event.type}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
