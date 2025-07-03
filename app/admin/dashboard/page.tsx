"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarIcon, Search, X, Settings, Bell, MessageCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { OhliverWelcomeNotification } from "@/components/ohliver-welcome-notification"

export default function AdminDashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const { user, userData, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("registered") === "true") {
      setShowWelcomeNotification(true)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin- Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="h-5 w-5 text-gray-600" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={user?.photoURL || "/placeholder-user.jpg"} />
                <AvatarFallback>{userData?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/account")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-800">Johnny's Dashboard</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-8 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-[200px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-red-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">No metrics yet.</div>
            <p className="text-xs text-white/80">No data available for this period.</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">No metrics yet.</div>
            <p className="text-xs text-white/80">No data available for this period.</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">No metrics yet.</div>
            <p className="text-xs text-white/80">No data available for this period.</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">No metrics yet.</div>
            <p className="text-xs text-white/80">No data available for this period.</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for other dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent activity.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No upcoming events.</p>
          </CardContent>
        </Card>
      </div>

      {showWelcomeNotification && (
        <OhliverWelcomeNotification
          isOpen={showWelcomeNotification}
          onClose={() => setShowWelcomeNotification(false)}
        />
      )}
    </div>
  )
}
