"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Define a type for department data
interface Department {
  id: string
  name: string
  headerColor: string // This will now be a Tailwind class name, e.g., "bg-department-sales-red"
  members: string[]
  metricLabel?: string
  metricValue?: string
  badgeCount?: number
  href?: string // Optional link for the card
}

// Department Card Component
function DepartmentCard({
  department,
}: {
  department: Department
}) {
  const cardContent = (
    <>
      <CardHeader className={cn("relative p-4 rounded-t-lg", department.headerColor)}>
        <CardTitle className="text-white text-lg font-semibold flex justify-between items-center">
          {department.name}
          {department.badgeCount !== undefined && (
            <Badge className="bg-white text-gray-800 rounded-full px-2 py-0.5 text-xs font-bold">
              {department.badgeCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 bg-card-content-background rounded-b-lg flex flex-col justify-between flex-grow">
        <div>
          {department.members.map((member, index) => (
            <p key={index} className="text-sm text-gray-700 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {member}
            </p>
          ))}
          {department.metricLabel && department.metricValue && (
            <div className="mt-4 text-sm">
              <p className="text-gray-500">{department.metricLabel}</p>
              <p className="font-bold text-gray-800">{department.metricValue}</p>
            </div>
          )}
        </div>
        <Button variant="outline" className="mt-4 w-full bg-transparent">
          <Plus className="mr-2 h-4 w-4" /> Add Widget
        </Button>
      </CardContent>
    </>
  )

  if (department.href) {
    return (
      <Link href={department.href} passHref>
        <Card className="h-full flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
          {cardContent}
        </Card>
      </Link>
    )
  }

  return <Card className="h-full flex flex-col overflow-hidden">{cardContent}</Card>
}

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("Jun 2025")

  const departmentData: Department[] = [
    {
      id: "sales",
      name: "Sales",
      headerColor: "bg-department-sales-red",
      members: ["Noemi", "Matthew"],
      metricLabel: "Monthly Revenue",
      metricValue: "4,000,000",
      badgeCount: 2,
      href: "/sales/dashboard",
    },
    {
      id: "logistics",
      name: "Logistics/ Operations",
      headerColor: "bg-department-logistics-blue",
      members: ["Chona", "May"],
      metricLabel: "Total Service Assignments",
      metricValue: "5",
      badgeCount: 1,
      href: "/logistics/dashboard",
    },
    {
      id: "accounting",
      name: "Accounting",
      headerColor: "bg-department-accounting-purple",
      members: ["Chairman"],
    },
    {
      id: "treasury",
      name: "Treasury",
      headerColor: "bg-department-treasury-green",
      members: ["Juvy"],
    },
    {
      id: "it",
      name: "I.T.",
      headerColor: "bg-department-it-teal",
      members: ["Emmerson"],
    },
    {
      id: "fleet",
      name: "Fleet",
      headerColor: "bg-department-fleet-gray",
      members: ["Jonathan"],
    },
    {
      id: "creatives",
      name: "Creatives/Contents",
      headerColor: "bg-department-creatives-orange",
      members: ["Eda"],
    },
    {
      id: "finance",
      name: "Finance",
      headerColor: "bg-department-finance-green",
      members: ["Juvy"],
    },
    {
      id: "media",
      name: "Media/ Procurement",
      headerColor: "bg-department-media-lightblue",
      members: ["Zen"],
    },
    {
      id: "businessDev",
      name: "Business Dev.",
      headerColor: "bg-department-businessdev-darkpurple",
      members: ["Nikki"],
    },
    {
      id: "legal",
      name: "Legal",
      headerColor: "bg-department-legal-darkred",
      members: ["Chona"],
      badgeCount: 2,
    },
    {
      id: "corporate",
      name: "Corporate",
      headerColor: "bg-department-corporate-lightblue",
      members: ["Anthony"],
      badgeCount: 1,
    },
    {
      id: "hr",
      name: "Human Resources",
      headerColor: "bg-department-hr-pink",
      members: ["Vanessa"],
      badgeCount: 1,
    },
    {
      id: "specialTeam",
      name: "Special Team",
      headerColor: "bg-department-specialteam-lightpurple",
      members: ["Mark"],
    },
    {
      id: "marketing",
      name: "Marketing",
      headerColor: "bg-department-marketing-red",
      members: ["John"],
    },
    {
      id: "addDepartment",
      name: "+ Add New Department",
      headerColor: "bg-department-add-darkgray",
      members: [], // No members for this card
    },
  ]

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Ohliver's Dashboard</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  {selectedDate} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedDate("Jan 2025")}>Jan 2025</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDate("Feb 2025")}>Feb 2025</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDate("Mar 2025")}>Mar 2025</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDate("Apr 2025")}>Apr 2025</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDate("May 2025")}>May 2025</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDate("Jun 2025")}>Jun 2025</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Department Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departmentData.map((department) => (
            <DepartmentCard key={department.id} department={department} />
          ))}
        </div>
      </div>
    </div>
  )
}
