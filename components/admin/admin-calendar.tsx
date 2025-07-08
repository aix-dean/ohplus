"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

// Sample admin event data
const sampleAdminEvents = [
  { id: "ADM-001", type: "Meeting", date: 5, color: "bg-blue-500", title: "Board Meeting" },
  { id: "ADM-002", type: "Review", date: 12, color: "bg-green-500", title: "Quarterly Review" },
  { id: "ADM-003", type: "Training", date: 18, color: "bg-purple-500", title: "Staff Training" },
  { id: "ADM-004", type: "Audit", date: 25, color: "bg-orange-500", title: "System Audit" },
  { id: "ADM-005", type: "Planning", date: 28, color: "bg-red-500", title: "Strategic Planning" },
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

export function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(4) // May = 4 (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025)
  const [selectedType, setSelectedType] = useState("all")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

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
    return sampleAdminEvents.filter((event) => event.date === day)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {months[currentMonth]} {currentYear}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="-Event Type-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-Event Type-</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="-Department-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-Department-</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="it">IT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center bg-gray-50 rounded">
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
