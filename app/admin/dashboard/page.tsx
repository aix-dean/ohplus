"use client" // Convert to client component

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context" // Assuming useAuth provides user data
import { RegistrationSuccessDialog } from "@/components/registration-success-dialog" // Import the dialog
import { RouteProtection } from "@/components/route-protection"

// Existing imports and content of app/admin/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge" // Added missing Badge

export default function AdminDashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, userData } = useAuth() // Get user data from auth context

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    const registeredParam = searchParams.get("registered")
    const dialogShownKey = "registrationSuccessDialogShown"

    if (registeredParam === "true" && !sessionStorage.getItem(dialogShownKey)) {
      setShowSuccessDialog(true)
      sessionStorage.setItem(dialogShownKey, "true") // Mark as shown for this session
      // Remove the query parameter immediately
      router.replace("/admin/dashboard", undefined)
    }
  }, [searchParams, router])

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    // No need to remove query param here, it's already done in useEffect
  }

  // Existing content from app/admin/dashboard/page.tsx
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("Jun 2025")

  // Define a type for department data
  interface Department {
    id: string
    name: string
    headerColor: string // Tailwind class name for header background
    contentBgColor: string // New: Tailwind class name for content background
    members: string[]
    metricLabel?: string
    metricValue?: string
    badgeCount?: number
    href?: string
    isAvailable?: boolean
  }

  // Department Card Component
  function DepartmentCard({
    department,
  }: {
    department: Department
  }) {
    const cardContent = (
      <>
        <CardHeader
          className={cn(
            "relative p-4 rounded-t-lg",
            department.isAvailable !== false ? department.headerColor : "bg-gray-400",
            department.isAvailable === false && "grayscale",
          )}
        >
          <CardTitle
            className={cn(
              "text-white text-lg font-semibold flex justify-between items-center",
              department.isAvailable === false && "opacity-60",
            )}
          >
            {department.name}
            {department.badgeCount !== undefined && (
              <Badge
                className={cn(
                  "bg-white text-gray-800 rounded-full px-2 py-0.5 text-xs font-bold",
                  department.isAvailable === false && "opacity-60",
                )}
              >
                {department.badgeCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cn(
            "p-4 rounded-b-lg flex flex-col justify-between flex-grow",
            department.isAvailable !== false ? department.contentBgColor : "bg-gray-100",
            department.isAvailable === false && "grayscale",
          )}
        >
          <div>
            {department.members.map((member, index) => (
              <p
                key={index}
                className={cn(
                  "text-sm text-gray-700 flex items-center gap-1",
                  department.isAvailable === false && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    department.isAvailable !== false ? "bg-green-500" : "bg-gray-400",
                  )}
                />
                {member}
              </p>
            ))}
            {department.metricLabel && department.metricValue && (
              <div className={cn("mt-4 text-sm", department.isAvailable === false && "opacity-60")}>
                <p className="text-gray-500">{department.metricLabel}</p>
                <p className="font-bold text-gray-800">{department.metricValue}</p>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className={cn(
              "mt-4 w-full bg-transparent",
              department.isAvailable === false && "opacity-60 cursor-not-allowed",
            )}
            disabled={department.isAvailable === false}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Widget
          </Button>
        </CardContent>
      </>
    )

    if (department.href && department.isAvailable !== false) {
      return (
        <Link href={department.href} passHref>
          <Card className="h-full flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
            {cardContent}
          </Card>
        </Link>
      )
    }

    return (
      <Card
        className={cn("h-full flex flex-col overflow-hidden", department.isAvailable === false && "cursor-not-allowed")}
      >
        {cardContent}
      </Card>
    )
  }

  const departmentData: Department[] = [
    {
      id: "sales",
      name: "Sales",
      headerColor: "bg-department-sales-red",
      contentBgColor: "bg-card-content-sales",
      members: [],
      badgeCount: 2,
      href: "/sales/dashboard",
      isAvailable: true,
    },
    {
      id: "logistics",
      name: "Logistics/ Operations",
      headerColor: "bg-department-logistics-blue",
      contentBgColor: "bg-card-content-logistics",
      members: [],
      badgeCount: 1,
      href: "/logistics/dashboard",
      isAvailable: true,
    },
    {
      id: "creatives",
      name: "Creatives/Contents",
      headerColor: "bg-department-creatives-orange",
      contentBgColor: "bg-card-content-creatives",
      members: [],
      href: "/cms/dashboard",
      isAvailable: true,
    },
    {
      id: "accounting",
      name: "Accounting",
      headerColor: "bg-department-accounting-purple",
      contentBgColor: "bg-card-content-accounting",
      members: [],
      href: "/accounting/dashboard",
      isAvailable: true,
    },
    {
      id: "treasury",
      name: "Treasury",
      headerColor: "bg-department-treasury-green",
      contentBgColor: "bg-card-content-treasury",
      members: [],
      href: "/treasury",
      isAvailable: true,
    },
    {
      id: "it",
      name: "I.T.",
      headerColor: "bg-department-it-teal",
      contentBgColor: "bg-card-content-it",
      members: [],
      href: "/it",
      isAvailable: true,
    },
    {
      id: "fleet",
      name: "Fleet",
      headerColor: "bg-department-fleet-gray",
      contentBgColor: "bg-card-content-fleet",
      members: [],
      badgeCount: 1,
      isAvailable: false,
    },
    {
      id: "finance",
      name: "Finance",
      headerColor: "bg-department-finance-green",
      contentBgColor: "bg-card-content-finance",
      members: [],
      href: "/finance",
      isAvailable: true,
    },
    {
      id: "media",
      name: "Media/ Procurement",
      headerColor: "bg-department-media-lightblue",
      contentBgColor: "bg-card-content-media",
      members: [],
      badgeCount: 2,
      isAvailable: false,
    },
    {
      id: "businessDev",
      name: "Business Dev.",
      headerColor: "bg-department-businessdev-darkpurple",
      contentBgColor: "bg-card-content-businessdev",
      members: [],
      href: "/business/inventory",
      isAvailable: true,
    },
    {
      id: "legal",
      name: "Legal",
      headerColor: "bg-department-legal-darkred",
      contentBgColor: "bg-card-content-legal",
      members: [],
      badgeCount: 2,
      isAvailable: false,
    },
    {
      id: "corporate",
      name: "Corporate",
      headerColor: "bg-department-corporate-lightblue",
      contentBgColor: "bg-card-content-corporate",
      members: [],
      badgeCount: 1,
      isAvailable: false,
    },
    {
      id: "hr",
      name: "Human Resources",
      headerColor: "bg-department-hr-pink",
      contentBgColor: "bg-card-content-hr",
      members: [],
      badgeCount: 1,
      isAvailable: false,
    },
    {
      id: "specialTeam",
      name: "Special Team",
      headerColor: "bg-department-specialteam-lightpurple",
      contentBgColor: "bg-card-content-specialteam",
      members: [],
      isAvailable: false,
    },
    {
      id: "marketing",
      name: "Marketing",
      headerColor: "bg-department-marketing-red",
      contentBgColor: "bg-card-content-marketing",
      members: [],
      isAvailable: false,
    },
  ]

  // Filter departments based on search term
  const filteredDepartments = departmentData.filter((department) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return (
      department.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      department.members.some((member) => member.toLowerCase().includes(lowerCaseSearchTerm))
    )
  })

  return (
    <RouteProtection requiredRoles="admin">
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold">
              {userData?.first_name
                ? `${userData.first_name.charAt(0).toUpperCase()}${userData.first_name.slice(1).toLowerCase()}'s Dashboard`
                : "Dashboard"}
            </h1>
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
            {filteredDepartments.map((department) => (
              <DepartmentCard key={department.id} department={department} />
            ))}
          </div>
        </div>

        {/* Registration Success Dialog */}
        <RegistrationSuccessDialog
          isOpen={showSuccessDialog}
          firstName={user?.first_name || ""} // Pass the user's first name
          onClose={handleCloseSuccessDialog}
        />
      </div>
    </RouteProtection>
  )
}

// Dummy imports for existing content to avoid errors. Replace with actual imports if needed.
import { Search, ChevronDown, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
