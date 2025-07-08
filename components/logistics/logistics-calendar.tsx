"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown } from "lucide-react"

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
  // Get current date
  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth()) // Current month (0-indexed)
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear()) // Current year
  const [saType, setSaType] = useState("")
  const [sites, setSites] = useState("")
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

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

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value)
    setCurrentMonth(selectedDate.getMonth())
    setCurrentYear(selectedDate.getFullYear())
    setShowFallbackPicker(false)
  }

  const handleMonthClick = () => {
    try {
      if (hiddenInputRef.current && typeof hiddenInputRef.current.showPicker === "function") {
        hiddenInputRef.current.showPicker()
      } else {
        // Fallback: focus the input to trigger the picker
        if (hiddenInputRef.current) {
          hiddenInputRef.current.focus()
          hiddenInputRef.current.click()
        }
        setShowFallbackPicker(true)
      }
    } catch (error) {
      console.warn("showPicker not supported, using fallback", error)
      // Fallback approach
      setShowFallbackPicker(true)
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus()
      }
    }
  }

  const getEventsForDay = (day: number) => {
    return sampleEvents.filter((event) => event.date === day)
  }

  // Check if a day is today
  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
  }

  // Format current date for input value
  const currentDateValue = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center relative">
          <button
            onClick={handleMonthClick}
            className="flex items-center space-x-2 text-lg font-semibold hover:bg-gray-100 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            <span>
              {months[currentMonth]} {currentYear}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {/* Hidden month input */}
          <input
            ref={hiddenInputRef}
            type="month"
            value={currentDateValue}
            onChange={handleDateChange}
            className={`absolute ${showFallbackPicker ? "opacity-100 z-10" : "opacity-0 pointer-events-none"} 
              ${showFallbackPicker ? "top-full left-0 mt-1 border border-gray-300 rounded px-2 py-1 bg-white shadow-lg" : ""}`}
            style={showFallbackPicker ? {} : { position: "absolute", left: "-9999px" }}
            onBlur={() => setShowFallbackPicker(false)}
          />
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
      <div className="grid grid-cols-7 rounded-t-md">
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
      <div className="grid grid-cols-7 border border-gray-200">
        {calendarDays.map((day, index) => {
          const isLastColumn = (index + 1) % 7 === 0
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border-b border-gray-200 ${!isLastColumn ? "border-r border-gray-200" : ""}`}
            >
              {day && (
                <>
                  <div
                    className={`text-sm font-medium mb-1 ${isToday(day) ? "text-blue-600 font-bold bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center" : "text-gray-900"}`}
                  >
                    {day}
                  </div>
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
          )
        })}
      </div>
    </div>
  )
}
