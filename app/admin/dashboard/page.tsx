"use client"
import { useState } from "react"
import Link from "next/link"
import { Calendar, Search, Dot, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/firebase-service"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth" // Import useAuth hook

// Number of items to display per page
const ITEMS_PER_PAGE = 12

// Function to get site code from product
const getSiteCode = (product: Product | null) => {
  if (!product) return null

  // Try different possible locations for site_code
  if (product.site_code) return product.site_code
  if (product.specs_rental && "site_code" in product.specs_rental) return product.specs_rental.site_code
  if (product.light && "site_code" in product) return product.light.siteCode

  // Check for camelCase variant
  if ("siteCode" in product) return (product as any).siteCode

  return null
}

// Map for inline header colors
const headerColorMap: Record<string, string> = {
  salesHeader: "#FF5757",
  logisticsHeader: "#4A90E2",
  accountingHeader: "#C70039",
  treasuryHeader: "#287D3C",
  itHeader: "#00A896",
  fleetHeader: "#8D8D8D",
  creativesHeader: "#E87B00",
  financeHeader: "#7CB342",
  mediaHeader: "#00BCD4",
  businessDevHeader: "#5C6BC0",
  legalHeader: "#B71C1C",
  corporateHeader: "#2196F3",
  humanResourcesHeader: "#FF69B4",
  specialTeamHeader: "#673AB7",
  marketingHeader: "#D32F2F",
  addDepartmentHeader: "#424242",
}

interface DepartmentCardProps {
  title: string
  headerColor: keyof typeof headerColorMap
  members: string[]
  metricLabel?: string
  metricValue?: string
  badgeCount?: number
  href?: string // Optional href for navigation
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
          + Add Widget
        </Button>
      </CardContent>
    </>
  )

  return href ? (
    <Link href={href} passHref>
      <Card className="overflow-hidden shadow-md rounded-xl flex flex-col h-full cursor-pointer hover:shadow-lg transition-shadow">
        {cardContent}
      </Card>
    </Link>
  ) : (
    <Card className="overflow-hidden shadow-md rounded-xl flex flex-col h-full">{cardContent}</Card>
  )
}

function AdminDashboardContent() {
  const { userData } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Dummy data for department cards
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
              {userData?.first_name ? `${userData.first_name}'s Dashboard` : "Ohliver's Dashboard"}
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
                  Jun 2025
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>January 2025</DropdownMenuItem>
                <DropdownMenuItem>February 2025</DropdownMenuItem>
                <DropdownMenuItem>March 2025</DropdownMenuItem>
                <DropdownMenuItem>April 2025</DropdownMenuItem>
                <DropdownMenuItem>May 2025</DropdownMenuItem>
                <DropdownMenuItem>June 2025</DropdownMenuItem>
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
