"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { collection, query, getDocs, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface ServiceAssignment {
  id: string
  type: string
  date: number
  color: string
  alarmDate?: Timestamp
  serviceType?: string
  status?: string
  saNumber?: string
  projectSiteName?: string
  assignedTo?: string
  alarmTime?: string
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

// Color mapping for different service types
const getColorForType = (type: string): string => {
  const colorMap: { [key: string]: string } = {
    "Roll up": "bg-blue-500",
    Maintenance: "bg-green-500",
    Repair: "bg-purple-500",
    Installation: "bg-cyan-500",
    Inspection: "bg-orange-500",
    Cleaning: "bg-red-500",
    default: "bg-gray-500",
  }
  return colorMap[type] || colorMap.default
}

// Get unique service types for filter
const getUniqueServiceTypes = (assignments: ServiceAssignment[]): string[] => {
  const types = assignments.map((assignment) => assignment.serviceType || assignment.type).filter(Boolean)
  return Array.from(new Set(types))
}

export default function LogisticsCalendar() {
  const router = useRouter()
  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
  const [saType, setSaType] = useState("all") // Updated default value to "all"
  const [sites, setSites] = useState("all") // Updated default value to "all"
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([])
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchServiceAssignments = async () => {
      try {
        setLoading(true)

        const startOfMonth = new Date(currentYear, currentMonth, 1)
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

        const q = query(
          collection(db, "service_assignments"),
          where("alarmDate", ">=", Timestamp.fromDate(startOfMonth)),
          where("alarmDate", "<=", Timestamp.fromDate(endOfMonth)),
        )

        const querySnapshot = await getDocs(q)
        const assignments: ServiceAssignment[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const alarmDate = data.alarmDate?.toDate()

          if (alarmDate) {
            const serviceType = data.serviceType || "Unknown"
            assignments.push({
              id: doc.id,
              type: serviceType,
              date: alarmDate.getDate(),
              color: getColorForType(serviceType),
              alarmDate: data.alarmDate,
              serviceType: data.serviceType,
              status: data.status,
              saNumber: data.saNumber,
              projectSiteName: data.projectSiteName,
              assignedTo: data.assignedTo,
              alarmTime: data.alarmTime,
            })
          }
        })

        setServiceAssignments(assignments)
        setAvailableServiceTypes(getUniqueServiceTypes(assignments))
      } catch (error) {
        console.error("Error fetching service assignments:", error)
        setServiceAssignments([])
        setAvailableServiceTypes([])
      } finally {
        setLoading(false)
      }
    }

    fetchServiceAssignments()
  }, [currentMonth, currentYear])

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const calendarDays = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

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
    setShowFallbackPicker(true)

    setTimeout(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus()
      }
    }, 100)
  }

  const handleAssignmentClick = (assignment: ServiceAssignment) => {
    router.push(`/logistics/site-information/${assignment.id}`)
  }

  const getEventsForDay = (day: number) => {
    let filteredAssignments = serviceAssignments.filter((assignment) => assignment.date === day)

    if (saType !== "all") {
      filteredAssignments = filteredAssignments.filter((assignment) => assignment.serviceType === saType)
    }

    return filteredAssignments
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
  }

  const currentDateValue = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button variant="ghost" onClick={() => setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button onClick={handleMonthClick} className="text-xl font-semibold hover:text-blue-600 transition-colors">
            {MONTHS[currentMonth]} {currentYear}
          </button>

          <button variant="ghost" onClick={() => setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1))}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={saType} onValueChange={setSaType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="SA Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {availableServiceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sites} onValueChange={setSites}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              <SelectItem value="site1">Site 1</SelectItem>
              <SelectItem value="site2">Site 2</SelectItem>
              <SelectItem value="site3">Site 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hidden month input for native picker */}
      {showFallbackPicker && (
        <input
          ref={hiddenInputRef}
          type="month"
          value={currentDateValue}
          onChange={handleDateChange}
          className="mb-4"
          onBlur={() => setShowFallbackPicker(false)}
          autoFocus
        />
      )}

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div key={index} className="min-h-[120px] border border-gray-200 p-2">
              {day && (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-sm font-medium ${isToday(day) ? "text-blue-600 font-bold" : "text-gray-900"}`}
                    >
                      {day}
                    </span>
                    {isToday(day) && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                  </div>
                  <div className="space-y-1">
                    {loading ? (
                      <div className="text-xs text-gray-400">Loading...</div>
                    ) : (
                      getEventsForDay(day).map((assignment) => (
                        <button
                          key={assignment.id}
                          onClick={() => handleAssignmentClick(assignment)}
                          className={`${assignment.color} text-white text-xs px-2 py-1 rounded text-center font-medium w-full hover:opacity-80 transition-opacity cursor-pointer`}
                          title={`SA: ${assignment.saNumber || "N/A"} - ${assignment.projectSiteName || "Unknown Site"} - ${assignment.alarmTime || "No time"} - Status: ${assignment.status || "Unknown"}`}
                        >
                          {assignment.saNumber || assignment.id}: {assignment.serviceType || assignment.type}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
