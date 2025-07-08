"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
  projectSiteName?: string
  assignedTo?: string
}

export default function LogisticsCalendar() {
  const router = useRouter()
  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
  const [selectedSAType, setSelectedSAType] = useState<string>("all")
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showFallbackPicker, setShowFallbackPicker] = useState(false)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    fetchServiceAssignments()
  }, [currentMonth, currentYear])

  const fetchServiceAssignments = async () => {
    try {
      setLoading(true)
      const startOfMonth = new Date(currentYear, currentMonth, 1)
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

      const q = query(
        collection(db, "service_assignments"),
        where("alarmDate", ">=", Timestamp.fromDate(startOfMonth)),
        where("alarmDate", "<=", Timestamp.fromDate(endOfMonth)),
      )

      const querySnapshot = await getDocs(q)
      const assignmentsData: ServiceAssignment[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        assignmentsData.push({
          id: doc.id,
          saNumber: data.saNumber,
          serviceType: data.serviceType,
          status: data.status,
          alarmDate: data.alarmDate,
          alarmTime: data.alarmTime,
          projectSiteName: data.projectSiteName,
          assignedTo: data.assignedTo,
        })
      })

      setAssignments(assignmentsData)
    } catch (error) {
      console.error("Error fetching service assignments:", error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
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

  const getAssignmentsForDay = (day: number) => {
    return assignments.filter((assignment) => {
      if (!assignment.alarmDate) return false
      const assignmentDate = assignment.alarmDate.toDate()
      return (
        assignmentDate.getDate() === day &&
        assignmentDate.getMonth() === currentMonth &&
        assignmentDate.getFullYear() === currentYear
      )
    })
  }

  const getFilteredAssignmentsForDay = (day: number) => {
    let dayAssignments = getAssignmentsForDay(day)

    if (selectedSAType !== "all") {
      dayAssignments = dayAssignments.filter((assignment) => assignment.serviceType === selectedSAType)
    }

    if (selectedSite !== "all") {
      dayAssignments = dayAssignments.filter((assignment) => assignment.projectSiteName === selectedSite)
    }

    return dayAssignments
  }

  const getColorForType = (serviceType: string) => {
    const colors = {
      "Roll up": "bg-blue-500",
      Installation: "bg-green-500",
      Maintenance: "bg-orange-500",
      Repair: "bg-red-500",
      Inspection: "bg-purple-500",
      Cleaning: "bg-cyan-500",
    }
    return colors[serviceType as keyof typeof colors] || "bg-gray-500"
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
        if (hiddenInputRef.current.showPicker) {
          hiddenInputRef.current.showPicker()
        } else {
          hiddenInputRef.current.focus()
          hiddenInputRef.current.click()
        }
      }
    } catch (error) {
      console.error("Error showing picker:", error)
      setShowFallbackPicker(true)
    }
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split("-")
    setCurrentYear(Number.parseInt(year))
    setCurrentMonth(Number.parseInt(month) - 1)
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
      const dayAssignments = getFilteredAssignmentsForDay(day)
      const todayClass = isToday(day) ? "bg-blue-50 text-blue-600 font-bold" : ""

      days.push(
        <div key={day} className={`h-32 border border-gray-200 p-2 ${todayClass}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm ${isToday(day) ? "font-bold" : ""}`}>{day}</span>
            {isToday(day) && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
          </div>
          <div className="space-y-1">
            {dayAssignments.slice(0, 3).map((assignment) => (
              <button
                key={assignment.id}
                onClick={() => handleAssignmentClick(assignment.id)}
                className={`w-full text-left px-2 py-1 rounded text-xs text-white font-medium hover:opacity-80 transition-opacity ${getColorForType(assignment.serviceType || "")}`}
              >
                {assignment.saNumber}: {assignment.serviceType}
              </button>
            ))}
            {dayAssignments.length > 3 && (
              <div className="text-xs text-gray-500">+{dayAssignments.length - 3} more</div>
            )}
          </div>
        </div>,
      )
    }

    return days
  }

  const uniqueServiceTypes = Array.from(new Set(assignments.map((a) => a.serviceType).filter(Boolean)))
  const uniqueSites = Array.from(new Set(assignments.map((a) => a.projectSiteName).filter(Boolean)))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button onClick={handleMonthClick} className="text-xl font-semibold hover:text-blue-600 transition-colors">
            {months[currentMonth]} {currentYear}
          </button>
          <Button variant="ghost" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
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
        className={showFallbackPicker ? "mb-4" : "absolute -left-full opacity-0"}
        style={showFallbackPicker ? {} : { position: "absolute", left: "-9999px" }}
      />

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50">
          {daysOfWeek.map((day) => (
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
          {loading
            ? Array.from({ length: 35 }).map((_, index) => (
                <div key={index} className="h-32 border border-gray-200 p-2">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-6 mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))
            : renderCalendarDays()}
        </div>
      </div>
    </div>
  )
}
