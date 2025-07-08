"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface ServiceAssignment {
  id: string
  saNumber?: string
  serviceType?: string
  status?: string
  alarmDate?: Timestamp
  alarmTime?: string
  coveredDateStart?: Timestamp
  coveredDateEnd?: Timestamp
  projectSiteName?: string
  projectSiteLocation?: string
  projectSiteId?: string
  assignedTo?: string
  jobDescription?: string
  message?: string
  requestedBy?: {
    name?: string
    department?: string
    id?: string
  }
  attachments?: any[]
  created?: Timestamp
  updated?: Timestamp
}

interface CalendarEvent {
  id: string
  type: string
  date: Date
  color: string
}

export function LogisticsCalendar() {
  const router = useRouter()
  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
  const [selectedSAType, setSelectedSAType] = useState<string>("all")
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  const monthNames = [
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

  const fetchServiceAssignments = async () => {
    try {
      setLoading(true)

      // Create date range for the current month
      const startOfMonth = new Date(currentYear, currentMonth, 1)
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

      const startTimestamp = Timestamp.fromDate(startOfMonth)
      const endTimestamp = Timestamp.fromDate(endOfMonth)

      const q = query(
        collection(db, "service_assignments"),
        where("alarmDate", ">=", startTimestamp),
        where("alarmDate", "<=", endTimestamp),
      )

      const querySnapshot = await getDocs(q)
      const assignments: ServiceAssignment[] = []
      const typesSet = new Set<string>()

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ServiceAssignment
        assignments.push({
          id: doc.id,
          ...data,
        })

        if (data.serviceType) {
          typesSet.add(data.serviceType)
        }
      })

      // Convert to calendar events
      const calendarEvents: CalendarEvent[] = assignments
        .filter((assignment) => {
          if (selectedSAType === "all") return true
          return assignment.serviceType === selectedSAType
        })
        .map((assignment) => ({
          id: assignment.id,
          type: `${assignment.saNumber}: ${assignment.serviceType}`,
          date: assignment.alarmDate?.toDate() || new Date(),
          color: getColorForType(assignment.serviceType || ""),
        }))

      setEvents(calendarEvents)
      setServiceTypes(Array.from(typesSet))
    } catch (error) {
      console.error("Error fetching service assignments:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const getColorForType = (type: string): string => {
    const colors: { [key: string]: string } = {
      "Roll up": "bg-blue-500",
      Installation: "bg-green-500",
      Maintenance: "bg-orange-500",
      Repair: "bg-red-500",
      Inspection: "bg-purple-500",
    }
    return colors[type] || "bg-gray-500"
  }

  useEffect(() => {
    fetchServiceAssignments()
  }, [currentMonth, currentYear, selectedSAType])

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
  }

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === day && eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
      )
    })
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleMonthClick = () => {
    try {
      if (hiddenInputRef.current) {
        // Try the modern showPicker method first
        if (typeof hiddenInputRef.current.showPicker === "function") {
          hiddenInputRef.current.showPicker()
        } else {
          // Fallback to focus and click
          hiddenInputRef.current.focus()
          hiddenInputRef.current.click()
        }
      }
    } catch (error) {
      console.error("Error showing picker:", error)
      // Final fallback - show visible input
      setShowFallbackPicker(true)
    }
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split("-").map(Number)
    setCurrentYear(year)
    setCurrentMonth(month - 1) // Month is 0-indexed
    setShowFallbackPicker(false)
  }

  const handleAssignmentClick = (assignmentId: string) => {
    router.push(`/logistics/site-information/${assignmentId}`)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-200"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day)
      const todayClass = isToday(day) ? "bg-blue-50 text-blue-600 font-bold" : ""

      days.push(
        <div key={day} className={`h-32 border border-gray-200 p-2 ${todayClass}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm ${isToday(day) ? "font-bold" : ""}`}>{day}</span>
            {isToday(day) && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event, index) => (
              <button
                key={index}
                onClick={() => handleAssignmentClick(event.id)}
                className={`${event.color} text-white text-xs px-2 py-1 rounded text-left w-full truncate hover:opacity-80 transition-opacity cursor-pointer`}
                title={event.type}
              >
                {event.type}
              </button>
            ))}
            {dayEvents.length > 3 && <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>}
          </div>
        </div>,
      )
    }

    return days
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={handleMonthClick}
              className="text-lg font-semibold hover:text-blue-600 transition-colors cursor-pointer"
            >
              {monthNames[currentMonth]} {currentYear}
            </button>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedSAType} onValueChange={setSelectedSAType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="SA Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {serviceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hidden month input for native picker */}
      <input
        ref={hiddenInputRef}
        type="month"
        value={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
        onChange={handleMonthChange}
        className="absolute -left-[9999px] opacity-0 pointer-events-none"
        style={{ position: "absolute", left: "-9999px" }}
      />

      {/* Fallback visible month picker */}
      {showFallbackPicker && (
        <div className="mb-4">
          <input
            type="month"
            value={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
            onChange={handleMonthChange}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
      )}

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50">
          {daysOfWeek.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {loading ? <div className="col-span-7 text-center py-8">Loading...</div> : renderCalendarDays()}
        </div>
      </div>
    </div>
  )
}
