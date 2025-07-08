"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

export default function LogisticsCalendar() {
  const router = useRouter()
  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
  const [selectedSAType, setSelectedSAType] = useState<string>("all")
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  // Fetch service assignments from Firestore
  useEffect(() => {
    const fetchServiceAssignments = async () => {
      try {
        setLoading(true)

        // Create date range for the current month
        const startOfMonth = new Date(currentYear, currentMonth, 1)
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

        const q = query(
          collection(db, "service_assignments"),
          where("alarmDate", ">=", Timestamp.fromDate(startOfMonth)),
          where("alarmDate", "<=", Timestamp.fromDate(endOfMonth)),
        )

        const querySnapshot = await getDocs(q)
        const fetchedAssignments: ServiceAssignment[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedAssignments.push({
            id: doc.id,
            ...data,
          } as ServiceAssignment)
        })

        setAssignments(fetchedAssignments)

        // Convert assignments to calendar events
        const calendarEvents: CalendarEvent[] = fetchedAssignments.map((assignment) => ({
          id: assignment.id,
          type: `${assignment.saNumber}: ${assignment.serviceType}`,
          date: assignment.alarmDate?.toDate() || new Date(),
          color: getColorForType(assignment.serviceType || ""),
        }))

        setEvents(calendarEvents)
      } catch (error) {
        console.error("Error fetching service assignments:", error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchServiceAssignments()
  }, [currentMonth, currentYear])

  const getColorForType = (type: string): string => {
    const colors: { [key: string]: string } = {
      Installation: "bg-blue-500",
      Maintenance: "bg-green-500",
      "Roll up": "bg-blue-500",
      Repair: "bg-red-500",
      Inspection: "bg-yellow-500",
      Cleaning: "bg-purple-500",
    }
    return colors[type] || "bg-gray-500"
  }

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

  const filteredEvents = events.filter((event) => {
    const assignment = assignments.find((a) => a.id === event.id)
    if (!assignment) return false

    const matchesSAType = selectedSAType === "all" || assignment.serviceType === selectedSAType
    const matchesSite = selectedSite === "all" || assignment.projectSiteName === selectedSite

    return matchesSAType && matchesSite
  })

  const getFilteredEventsForDay = (day: number) => {
    return filteredEvents.filter((event) => {
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
          // Fallback for browsers that don't support showPicker
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
      days.push(<div key={`empty-${i}`} className="min-h-[120px] border border-gray-200 bg-gray-50"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getFilteredEventsForDay(day)
      const todayClass = isToday(day) ? "bg-blue-50 text-blue-600 font-bold" : ""

      days.push(
        <div key={day} className={`min-h-[120px] border border-gray-200 p-2 ${todayClass}`}>
          <div className="font-medium mb-2">{day}</div>
          <div className="space-y-1">
            {dayEvents.map((event, index) => (
              <button
                key={`${event.id}-${index}`}
                onClick={() => handleAssignmentClick(event.id)}
                className={`${event.color} text-white text-xs px-2 py-1 rounded block w-full text-left hover:opacity-80 transition-opacity cursor-pointer`}
                title={`SA: ${event.type} - Click for details`}
              >
                {event.type}
              </button>
            ))}
          </div>
        </div>,
      )
    }

    return days
  }

  // Get unique service types and sites for filters
  const uniqueServiceTypes = [...new Set(assignments.map((a) => a.serviceType).filter(Boolean))]
  const uniqueSites = [...new Set(assignments.map((a) => a.projectSiteName).filter(Boolean))]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={handleMonthClick}
              className="text-xl font-semibold hover:text-blue-600 transition-colors cursor-pointer"
            >
              {MONTHS[currentMonth]} {currentYear}
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
              {uniqueServiceTypes.map((type) => (
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
              {uniqueSites.map((site) => (
                <SelectItem key={site} value={site}>
                  {site}
                </SelectItem>
              ))}
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
        className={showFallbackPicker ? "mb-4 p-2 border rounded" : "absolute -left-[9999px] opacity-0"}
        style={showFallbackPicker ? {} : { position: "absolute", left: "-9999px", opacity: 0 }}
      />

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-4 text-center font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {loading
            ? // Loading skeleton
              Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="min-h-[120px] border border-gray-200 p-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-6"></div>
                  <div className="space-y-1">
                    <div className="h-6 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))
            : renderCalendarDays()}
        </div>
      </div>
    </div>
  )
}
