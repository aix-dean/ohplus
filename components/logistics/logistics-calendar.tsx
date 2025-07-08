"use client"

import { useState } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MONTHS = [
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function LogisticsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleMonthClick = () => {
    // Simple fallback without showPicker to avoid cross-origin issues
    const monthInput = document.createElement("input")
    monthInput.type = "month"
    monthInput.value = `${year}-${String(month + 1).padStart(2, "0")}`
    monthInput.style.position = "absolute"
    monthInput.style.top = "-9999px"
    document.body.appendChild(monthInput)

    monthInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement
      const [newYear, newMonth] = target.value.split("-").map(Number)
      setCurrentDate(new Date(newYear, newMonth - 1, 1))
      document.body.removeChild(monthInput)
    })

    // Focus and trigger click instead of showPicker
    setTimeout(() => {
      monthInput.focus()
      monthInput.click()
    }, 0)
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day)
    setSelectedDate(clickedDate)
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
      const isSelected = selectedDate?.toDateString() === new Date(year, month, day).toDateString()

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium
            hover:bg-blue-100 transition-colors
            ${isToday ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
            ${isSelected && !isToday ? "bg-blue-100 text-blue-600" : ""}
          `}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Logistics Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0 bg-transparent">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <button
                onClick={handleMonthClick}
                className="text-lg font-semibold hover:text-blue-600 transition-colors"
              >
                {MONTHS[month]} {year}
              </button>

              <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0 bg-transparent">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Info */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No events scheduled for this date.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
