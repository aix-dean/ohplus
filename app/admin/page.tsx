"use client"

import { useState } from "react"
import { Search, X, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

// Reusable Department Card Component
interface DepartmentCardProps {
  title: string
  members?: { name: string; avatar?: string }[]
  metricLabel?: string
  metricValue?: string
  badgeCount?: number
  color: string // Tailwind color class or hex code
  className?: string
}

function DepartmentCard({
  title,
  members,
  metricLabel,
  metricValue,
  badgeCount,
  color,
  className,
}: DepartmentCardProps) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardHeader className={`pb-2 pt-4 px-4 rounded-t-lg text-white`} style={{ backgroundColor: color }}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {badgeCount !== undefined && badgeCount > 0 && (
            <Badge className="bg-white text-black rounded-full px-2 py-0.5 text-xs font-bold">{badgeCount}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 bg-white rounded-b-lg">
        <div className="space-y-2">
          {members && members.length > 0 && (
            <div className="flex flex-col space-y-1">
              {members.map((member, index) => (
                <div key={index} className="flex items-center text-sm text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                  {member.name}
                </div>
              ))}
            </div>
          )}
          {metricLabel && metricValue && (
            <div className="text-sm text-gray-600">
              {metricLabel}: <span className="font-medium text-gray-800">{metricValue}</span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full text-sm text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
        >
          + Add Widget
        </Button>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())

  const departments = [
    {
      title: "Sales",
      members: [{ name: "Noemi" }, { name: "Matthew" }],
      metricLabel: "Monthly Revenue",
      metricValue: "4,000,000",
      badgeCount: 2,
      color: "#FF3366",
    },
    {
      title: "Logistics/ Operations",
      members: [{ name: "Chona" }, { name: "May" }],
      metricLabel: "Total Service Assignments",
      metricValue: "5",
      badgeCount: 1,
      color: "#6699FF",
    },
    {
      title: "Accounting",
      members: [{ name: "Chairman" }],
      color: "#CC3399",
    },
    {
      title: "Treasury",
      members: [{ name: "Juvy" }],
      color: "#339966",
    },
    {
      title: "I.T.",
      members: [{ name: "Emmerson" }],
      color: "#33CC99",
    },
    {
      title: "Fleet",
      members: [{ name: "Jonathan" }],
      color: "#999999",
    },
    {
      title: "Creatives/Contents",
      members: [{ name: "Eda" }],
      color: "#FF9933",
    },
    {
      title: "Finance",
      members: [{ name: "Juvy" }],
      color: "#66CC33",
    },
    {
      title: "Media/ Procurement",
      members: [{ name: "Zen" }],
      color: "#66CCFF",
    },
    {
      title: "Business Dev.",
      members: [{ name: "Nikki" }],
      color: "#9966FF",
    },
    {
      title: "Legal",
      members: [{ name: "Chona" }],
      badgeCount: 2,
      color: "#FFCC99",
    },
    {
      title: "Corporate",
      members: [{ name: "Anthony" }],
      badgeCount: 1,
      color: "#3366FF",
    },
    {
      title: "Human Resources",
      members: [{ name: "Vanessa" }],
      badgeCount: 1,
      color: "#FF66CC",
    },
    {
      title: "Special Team",
      members: [{ name: "Mark" }],
      color: "#9999CC",
    },
    {
      title: "Marketing",
      members: [{ name: "John" }],
      color: "#CC3333",
    },
    {
      title: "+ Add New Department",
      color: "#333333",
      className: "flex flex-col justify-center items-center text-center", // Center content for this card
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ohliver's Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-[180px] justify-between text-left font-normal ${!date && "text-muted-foreground"}`}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {date ? format(date, "MMM yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={2000}
                toYear={2030}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {departments.map((dept, index) => (
          <DepartmentCard key={index} {...dept} />
        ))}
      </div>
    </div>
  )
}
