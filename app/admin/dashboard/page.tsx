"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, X, Calendar, ChevronDown, Dot, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Map header color names to their hex values for inline styling
const headerColorMap: Record<string, string> = {
  salesHeader: "#FF5757",
  logisticsHeader: "#4A90E2",
  accountingHeader: "#C70039",
  treasuryHeader: "#287D3C",
  itHeader: "#00A896",
  fleetHeader: "#8D8D8D",
  creativesHeader: "#E87B00",
  financeHeader: "#6BBF59",
  mediaHeader: "#00C1D4",
  businessDevHeader: "#5C4B8B",
  legalHeader: "#A00000",
  corporateHeader: "#007BFF",
  humanResourcesHeader: "#FF69B4",
  specialTeamHeader: "#8A2BE2",
  marketingHeader: "#E00000",
  addDepartmentHeader: "#333333",
}

interface DepartmentCardProps {
  title: string
  headerColor: keyof typeof headerColorMap
  members: string[]
  metricLabel?: string
  metricValue?: string
  badgeCount?: number
  href?: string // Added href prop for navigation
}

function DepartmentCard({
  title,
  headerColor,
  members,
  metricLabel,
  metricValue,
  badgeCount,
  href,
}: DepartmentCardProps) {
  const cardContent = (
    <Card className="w-full max-w-xs overflow-hidden rounded-xl shadow-md">
      <CardHeader className="relative p-4 text-white" style={{ backgroundColor: headerColorMap[headerColor] }}>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {badgeCount !== undefined && (
          <Badge className="absolute right-3 top-3 rounded-full bg-white text-gray-800 px-2 py-1 text-xs font-bold">
            {badgeCount}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          {members.map((member, index) => (
            <div key={index} className="flex items-center text-sm text-gray-700">
              <Dot className="h-4 w-4 text-green-500" />
              {member}
            </div>
          ))}
        </div>
        {metricLabel && metricValue && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">{metricLabel}</p>
            <p className="text-lg font-bold text-gray-800">{metricValue}</p>
          </div>
        )}
        <Button variant="outline" className="w-full bg-transparent">
          <Plus className="mr-2 h-4 w-4" /> Add Widget
        </Button>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{cardContent}</Link>
  }
  return cardContent
}

export default function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("Jun 2025")

  const departmentData = [
    {
      title: "Sales",
      headerColor: "salesHeader",
      members: ["Noemi", "Matthew"],
      metricLabel: "Monthly Revenue",
      metricValue: "4,000,000",
      badgeCount: 2,
      href: "/sales/dashboard", // Added navigation path
    },
    {
      title: "Logistics/ Operations",
      headerColor: "logisticsHeader",
      members: ["Chona", "May"],
      metricLabel: "Total Service Assignments",
      metricValue: "5",
      badgeCount: 1,
      href: "/logistics/dashboard", // Added navigation path
    },
    {
      title: "Accounting",
      headerColor: "accountingHeader",
      members: ["Chairman"],
    },
    {
      title: "Treasury",
      headerColor: "treasuryHeader",
      members: ["Juvy"],
    },
    {
      title: "I.T.",
      headerColor: "itHeader",
      members: ["Emmerson"],
    },
    {
      title: "Fleet",
      headerColor: "fleetHeader",
      members: ["Jonathan"],
    },
    {
      title: "Creatives/Contents",
      headerColor: "creativesHeader",
      members: ["Eda"],
    },
    {
      title: "Finance",
      headerColor: "financeHeader",
      members: ["Juvy"],
    },
    {
      title: "Media/ Procurement",
      headerColor: "mediaHeader",
      members: ["Zen"],
    },
    {
      title: "Business Dev.",
      headerColor: "businessDevHeader",
      members: ["Nikki"],
    },
    {
      title: "Legal",
      headerColor: "legalHeader",
      members: ["Chona"],
      badgeCount: 2,
    },
    {
      title: "Corporate",
      headerColor: "corporateHeader",
      members: ["Anthony"],
      badgeCount: 1,
    },
    {
      title: "Human Resources",
      headerColor: "humanResourcesHeader",
      members: ["Vanessa"],
      badgeCount: 1,
    },
    {
      title: "Special Team",
      headerColor: "specialTeamHeader",
      members: ["Mark"],
    },
    {
      title: "Marketing",
      headerColor: "marketingHeader",
      members: ["John"],
    },
    {
      title: "Add New Department",
      headerColor: "addDepartmentHeader",
      members: [],
    },
  ]

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl md:text-2xl font-bold">Ohliver's Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Calendar className="h-4 w-4" />
                  {selectedDate}
                  <ChevronDown className="h-4 w-4" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departmentData.map((department, index) => (
            <DepartmentCard key={index} {...department} />
          ))}
        </div>
      </div>
    </div>
  )
}
