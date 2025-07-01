"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CalendarDays, Plus, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface DepartmentCardProps {
  title: string
  color: string
  members?: { name: string; statusColor: string }[]
  metricLabel?: string
  metricValue?: string | number
  badgeCount?: number
}

function DepartmentCard({ title, color, members, metricLabel, metricValue, badgeCount }: DepartmentCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="relative p-4 pb-2 rounded-t-lg" style={{ backgroundColor: color }}>
        <CardTitle className="text-white text-lg font-semibold flex items-center justify-between">
          {title}
          {badgeCount !== undefined && badgeCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-white text-gray-800">
              {badgeCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 bg-white rounded-b-lg flex flex-col justify-between">
        <div>
          {members && members.length > 0 && (
            <div className="mb-2">
              {members.map((member, index) => (
                <div key={index} className="flex items-center text-sm mb-1">
                  <span className={`h-2 w-2 rounded-full mr-2 ${member.statusColor}`}></span>
                  {member.name}
                </div>
              ))}
            </div>
          )}
          {metricLabel && metricValue !== undefined && (
            <div className="text-sm text-gray-600">
              {metricLabel}: <span className="font-medium text-gray-800">{metricValue}</span>
            </div>
          )}
        </div>
        <Button variant="outline" className="w-full mt-4 bg-transparent">
          <Plus className="mr-2 h-4 w-4" /> Add Widget
        </Button>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const departments = [
    {
      title: "Sales",
      color: "#FF3366", // Red/Pink
      members: [
        { name: "Noemi", statusColor: "bg-green-500" },
        { name: "Matthew", statusColor: "bg-green-500" },
      ],
      metricLabel: "Monthly Revenue",
      metricValue: "4,000,000",
      badgeCount: 2,
    },
    {
      title: "Logistics/ Operations",
      color: "#6699FF", // Light Blue
      members: [
        { name: "Chona", statusColor: "bg-green-500" },
        { name: "May", statusColor: "bg-green-500" },
      ],
      metricLabel: "Total Service Assignments",
      metricValue: 5,
      badgeCount: 1,
    },
    {
      title: "Accounting",
      color: "#CC3399", // Magenta
      members: [{ name: "Chairman", statusColor: "bg-green-500" }],
    },
    {
      title: "Treasury",
      color: "#339966", // Dark Green
      members: [{ name: "Juvy", statusColor: "bg-green-500" }],
    },
    {
      title: "I.T.",
      color: "#33CC99", // Teal
      members: [{ name: "Emmerson", statusColor: "bg-green-500" }],
    },
    {
      title: "Fleet",
      color: "#999999", // Gray
      members: [{ name: "Jonathan", statusColor: "bg-green-500" }],
    },
    {
      title: "Creatives/Contents",
      color: "#FF9933", // Orange
      members: [{ name: "Eda", statusColor: "bg-green-500" }],
    },
    {
      title: "Finance",
      color: "#66CC33", // Lime Green
      members: [{ name: "Juvy", statusColor: "bg-green-500" }],
    },
    {
      title: "Media/ Procurement",
      color: "#66CCFF", // Lighter Blue
      members: [{ name: "Zen", statusColor: "bg-green-500" }],
    },
    {
      title: "Business Dev.",
      color: "#9966FF", // Light Purple
      members: [{ name: "Nikki", statusColor: "bg-green-500" }],
    },
    {
      title: "Legal",
      color: "#FFCC99", // Light Orange
      members: [{ name: "Chona", statusColor: "bg-green-500" }],
      badgeCount: 2,
    },
    {
      title: "Corporate",
      color: "#3366FF", // Medium Blue
      members: [{ name: "Anthony", statusColor: "bg-green-500" }],
      badgeCount: 1,
    },
    {
      title: "Human Resources",
      color: "#FF66CC", // Pink
      members: [{ name: "Vanessa", statusColor: "bg-green-500" }],
      badgeCount: 1,
    },
    {
      title: "Special Team",
      color: "#9999CC", // Lavender
      members: [{ name: "Mark", statusColor: "bg-green-500" }],
    },
    {
      title: "Marketing",
      color: "#CC3333", // Dark Red
      members: [{ name: "John", statusColor: "bg-green-500" }],
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ohliver&apos;s Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 pr-8 w-[250px] md:w-[300px] rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <CalendarDays className="h-4 w-4" />
                Jul 2025
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>January 2025</DropdownMenuItem>
              <DropdownMenuItem>February 2025</DropdownMenuItem>
              <DropdownMenuItem>March 2025</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Full Year 2025</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {departments.map((department, index) => (
          <DepartmentCard key={index} {...department} />
        ))}
        <Card className="flex flex-col h-full items-center justify-center border-2 border-dashed border-gray-300 bg-gray-100">
          <CardHeader className="flex items-center justify-center p-4">
            <CardTitle className="text-gray-700 text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add New Department
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <Button variant="outline" className="w-full bg-transparent">
              <Plus className="mr-2 h-4 w-4" /> Add Widget
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
