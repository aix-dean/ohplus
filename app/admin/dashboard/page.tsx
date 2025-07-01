"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, X, Calendar, ChevronDown, Dot, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context" // Corrected import path for useAuth
import { useDebounce } from "@/hooks/use-debounce" // Assuming this hook exists

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
    <>
      <CardHeader className="relative p-4 rounded-t-lg" style={{ backgroundColor: headerColorMap[headerColor] }}>
        <CardTitle className="text-white text-lg font-semibold flex justify-between items-center">
          {title}
          {badgeCount !== undefined && (
            <Badge className="bg-white text-gray-800 rounded-full px-2 py-0.5 text-xs font-bold">{badgeCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col justify-between flex-grow">
        <div className="space-y-1 mb-4">
          {members.map((member, index) => (
            <p key={index} className="text-sm text-gray-700 flex items-center">
              <Dot className="h-4 w-4 text-green-500 mr-1" /> {member}
            </p>
          ))}
        </div>
        {metricLabel && metricValue && (
          <div className="mt-auto pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">{metricLabel}</p>
            <p className="text-base font-bold text-gray-800">{metricValue}</p>
          </div>
        )}
        <Button variant="outline" className="mt-4 w-full bg-transparent">
          <Plus className="mr-2 h-4 w-4" /> Add Widget
        </Button>
      </CardContent>
    </>
  )

  if (href) {
    return (
      <Link href={href} passHref>
        <Card className="overflow-hidden shadow-md rounded-xl flex flex-col h-full cursor-pointer hover:shadow-lg transition-shadow">
          {cardContent}
        </Card>
      </Link>
    )
  }
  return <Card className="overflow-hidden shadow-md rounded-xl flex flex-col h-full">{cardContent}</Card>
}

function AdminDashboardContent() {
  const { userData } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [selectedDate, setSelectedDate] = useState("Jun 2025")

  const departmentData: DepartmentCardProps[] = [
    {
      title: "Sales",
      headerColor: "salesHeader",
      members: ["Noemi", "Matthew"],
      metricLabel: "Monthly Revenue",
      metricValue: "4,000,000",
      badgeCount: 2,
      href: "/sales/dashboard", // Link for Sales
    },
    {
      title: "Logistics/ Operations",
      headerColor: "logisticsHeader",
      members: ["Chona", "May"],
      metricLabel: "Total Service Assignments",
      metricValue: "5",
      badgeCount: 1,
      href: "/logistics/dashboard", // Link for Logistics
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

  // Filter departments based on search query
  const filteredDepartments = departmentData.filter(
    (department) =>
      department.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      department.members.some((member) => member.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
  )

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header with title, search box, and date filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl md:text-2xl font-bold">
              {userData?.displayName ? `${userData.displayName}'s Dashboard` : "Ohliver's Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 md:w-80">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Calendar className="h-4 w-4" />
                  {selectedDate}
                  <ChevronDown className="h-4 w-4 opacity-50" />
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
          {filteredDepartments.map((department, index) => (
            <DepartmentCard key={index} {...department} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return <AdminDashboardContent />
}
