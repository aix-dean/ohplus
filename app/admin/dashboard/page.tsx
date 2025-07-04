"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { RegistrationSuccessDialog } from "@/components/registration-success-dialog"
import { OnboardingTour } from "@/components/onboarding-tour"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function AdminDashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [shouldStartOnboardingTour, setShouldStartOnboardingTour] = useState(false)
  const [tourKey, setTourKey] = useState(0) // New state for the key prop
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("Jun 2025")

  useEffect(() => {
    const registeredParam = searchParams.get("registered")
    const dialogShownKey = "registrationSuccessDialogShown"

    if (registeredParam === "true" && !sessionStorage.getItem(dialogShownKey)) {
      setShowSuccessDialog(true)
      sessionStorage.setItem(dialogShownKey, "true")
      // Remove the 'registered' query parameter immediately after detecting it
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("registered")
      router.replace(newUrl.toString(), undefined, { shallow: true })
    }
  }, [searchParams, router])

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    setShouldStartOnboardingTour(true) // Set state to true to trigger the tour
    setTourKey((prevKey) => prevKey + 1) // Increment key to force remount
  }

  interface Department {
    id: string
    name: string
    headerColor: string
    contentBgColor: string
    members: string[]
    metricLabel?: string
    metricValue?: string
    badgeCount?: number
    href?: string
  }

  function DepartmentCard({ department }: { department: Department }) {
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
        <CardContent
          className={cn("p-4 rounded-b-lg flex flex-col justify-between flex-grow", department.contentBgColor)}
        >
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

  const departmentData: Department[] = [
    {
      id: "sales",
      name: "Sales",
      headerColor: "bg-department-sales-red",
      contentBgColor: "bg-card-content-sales",
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
      contentBgColor: "bg-card-content-logistics",
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
      contentBgColor: "bg-card-content-accounting",
      members: ["Chairman"],
    },
    {
      id: "treasury",
      name: "Treasury",
      headerColor: "bg-department-treasury-green",
      contentBgColor: "bg-card-content-treasury",
      members: ["Juvy"],
    },
    {
      id: "it",
      name: "I.T.",
      headerColor: "bg-department-it-teal",
      contentBgColor: "bg-card-content-it",
      members: ["Emmerson"],
    },
    {
      id: "fleet",
      name: "Fleet",
      headerColor: "bg-department-fleet-gray",
      contentBgColor: "bg-card-content-fleet",
      members: ["Jonathan"],
    },
    {
      id: "creatives",
      name: "Creatives/Contents",
      headerColor: "bg-department-creatives-orange",
      contentBgColor: "bg-card-content-creatives",
      members: ["Eda"],
    },
    {
      id: "finance",
      name: "Finance",
      headerColor: "bg-department-finance-green",
      contentBgColor: "bg-card-content-finance",
      members: ["Juvy"],
    },
    {
      id: "media",
      name: "Media/ Procurement",
      headerColor: "bg-department-media-lightblue",
      contentBgColor: "bg-card-content-media",
      members: ["Zen"],
    },
    {
      id: "businessDev",
      name: "Business Dev.",
      headerColor: "bg-department-businessdev-darkpurple",
      contentBgColor: "bg-card-content-businessdev",
      members: ["Nikki"],
    },
    {
      id: "legal",
      name: "Legal",
      headerColor: "bg-department-legal-darkred",
      contentBgColor: "bg-card-content-legal",
      members: ["Chona"],
      badgeCount: 2,
    },
    {
      id: "corporate",
      name: "Corporate",
      headerColor: "bg-department-corporate-lightblue",
      contentBgColor: "bg-card-content-corporate",
      members: ["Anthony"],
      badgeCount: 1,
    },
    {
      id: "hr",
      name: "Human Resources",
      headerColor: "bg-department-hr-pink",
      contentBgColor: "bg-card-content-hr",
      members: ["Vanessa"],
      badgeCount: 1,
    },
    {
      id: "specialTeam",
      name: "Special Team",
      headerColor: "bg-department-specialteam-lightpurple",
      contentBgColor: "bg-card-content-specialteam",
      members: ["Mark"],
    },
    {
      id: "marketing",
      name: "Marketing",
      headerColor: "bg-department-marketing-red",
      contentBgColor: "bg-card-content-marketing",
      members: ["John"],
    },
    {
      id: "addDepartment",
      name: "+ Add New Department",
      headerColor: "bg-department-add-darkgray",
      contentBgColor: "bg-card-content-add",
      members: [],
    },
  ]

  const filteredDepartments = departmentData.filter((department) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return (
      department.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      department.members.some((member) => member.toLowerCase().includes(lowerCaseSearchTerm))
    )
  })

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold">Ohliver's Dashboard</h1>
            <Button
              onClick={() => {
                localStorage.removeItem("onboardingTourCompleted") // Clear completion state
                setShouldStartOnboardingTour(true) // Set to true
                setTourKey((prevKey) => prevKey + 1) // Increment key to force remount
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Test Tour
            </Button>
          </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDepartments.map((department) => (
            <DepartmentCard key={department.id} department={department} />
          ))}
        </div>
      </div>

      <RegistrationSuccessDialog
        isOpen={showSuccessDialog}
        firstName={user?.first_name || ""}
        onClose={handleCloseSuccessDialog}
        onStartTour={handleCloseSuccessDialog} // This will trigger setting shouldStartOnboardingTour to true and incrementing tourKey
      />

      <OnboardingTour key={tourKey} triggerTour={shouldStartOnboardingTour} />
    </div>
  )
}
