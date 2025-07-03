"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SearchIcon, CalendarIcon, ListFilterIcon, Grid3X3Icon, CheckSquareIcon, BarChartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useTour } from "@/contexts/tour-context" // Import useTour
import { useSearchParams } from "next/navigation"

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState("Jun 2023")
  const { toast } = useToast()
  const { startTour } = useTour() // Get startTour function
  const searchParams = useSearchParams()

  useEffect(() => {
    const newRegistration = searchParams.get("newRegistration")
    if (newRegistration === "true") {
      startTour()
      toast({
        title: "Welcome to OH Plus!",
        description: "Let's get you started with a quick tour.",
      })
    }
  }, [searchParams, startTour, toast])

  const handleSearch = () => {
    toast({
      title: "Search Initiated",
      description: `Searching for "${searchTerm}"`,
    })
  }

  const handleFilter = (filter: string) => {
    toast({
      title: "Filter Applied",
      description: `Filtered by: ${filter}`,
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-bold">Johnny's Dashboard</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 rounded-md border border-gray-200 dark:border-gray-800 focus:ring-blue-500 focus:border-blue-500 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDateRange("Today")}>Today</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("This Week")}>This Week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("This Month")}>This Month</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateRange("Jun 2023")}>Jun 2023</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <ListFilterIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleFilter("All")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilter("Active")}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilter("Pending")}>Pending</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon">
                <Grid3X3Icon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <CheckSquareIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-red-500 text-white">
                <CardHeader>
                  <CardTitle>Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">No metrics yet.</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500 text-white">
                <CardHeader>
                  <CardTitle>Logistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">No metrics yet.</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-500 text-white">
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">No metrics yet.</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500 text-white">
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">No metrics yet.</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-2 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-purple-600 to-indigo-800 text-white">
          <h2 className="text-4xl font-extrabold mb-4">You're in!</h2>
          <p className="text-xl mb-2">Let's get your company online.</p>
          <p className="text-lg">Set up your first billboard site — it's quick.</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">No notification for now.</p>
            <Button variant="link" className="mt-2 p-0 h-auto">
              See All
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Dashboard</li>
              <li>Bulletin Board</li>
              <li>Project Tracker</li>
              <li>Calendar</li>
            </ul>
            <Button variant="link" className="mt-2 p-0 h-auto">
              See All
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-gray-800 rounded-md">
              <BarChartIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            </div>
            <Button variant="link" className="mt-2 p-0 h-auto">
              See All
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
