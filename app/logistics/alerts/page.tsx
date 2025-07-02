"use client"

import { useState } from "react"
import { Search, ChevronDown, Bell, CheckCircle, XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Alert {
  id: string
  type: "critical" | "warning" | "info"
  message: string
  timestamp: string
  status: "unread" | "read" | "resolved"
  details?: string
}

const mockAlerts: Alert[] = [
  {
    id: "A001",
    type: "critical",
    message: "LED Billboard #123 Offline",
    timestamp: "2024-07-01T10:30:00Z",
    status: "unread",
    details: "Billboard at EDSA location is not responding. Requires immediate attention.",
  },
  {
    id: "A002",
    type: "warning",
    message: "Low Stock: Vinyl Material",
    timestamp: "2024-07-01T09:00:00Z",
    status: "unread",
    details: "Vinyl material for static billboards is below reorder threshold. Please replenish soon.",
  },
  {
    id: "A003",
    type: "info",
    message: "Scheduled Maintenance: Digital Kiosk #456",
    timestamp: "2024-06-30T15:00:00Z",
    status: "read",
    details: "Digital Kiosk at SM Megamall is scheduled for routine maintenance on 2024-07-05.",
  },
  {
    id: "A004",
    type: "critical",
    message: "Vehicle #V007 Engine Malfunction",
    timestamp: "2024-06-29T08:45:00Z",
    status: "unread",
    details: "Delivery vehicle V007 reported engine issues. Currently stranded near Quezon City.",
  },
  {
    id: "A005",
    type: "warning",
    message: "Overdue Service Assignment: Site #789",
    timestamp: "2024-06-28T11:00:00Z",
    status: "read",
    details: "Service assignment for site #789 (content update) is 2 days overdue.",
  },
  {
    id: "A006",
    type: "info",
    message: "New Software Update Available",
    timestamp: "2024-06-27T14:00:00Z",
    status: "resolved",
    details: "A new version of the content management software is available for update.",
  },
]

export default function LogisticsAlertsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesSearch =
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.details && alert.details.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === "All" || alert.type === filterType
    const matchesStatus = filterStatus === "All" || alert.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getBadgeVariant = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "destructive"
      case "warning":
        return "secondary"
      case "info":
        return "outline"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status: Alert["status"]) => {
    switch (status) {
      case "read":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "unread":
        return <Bell className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Logistics Alerts</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search alerts..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Type: {filterType} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterType("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("critical")}>Critical</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("warning")}>Warning</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("info")}>Info</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Status: {filterStatus} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("unread")}>Unread</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("read")}>Read</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("resolved")}>Resolved</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Alerts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex-shrink-0 pt-1">
                    {alert.type === "critical" && <XCircle className="h-6 w-6 text-red-500" />}
                    {alert.type === "warning" && <Info className="h-6 w-6 text-yellow-500" />}
                    {alert.type === "info" && <Info className="h-6 w-6 text-blue-500" />}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{alert.message}</h3>
                      <Badge variant={getBadgeVariant(alert.type)}>{alert.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.details}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1">
                        {getStatusIcon(alert.status)}
                        <span>{alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {alert.status !== "resolved" && (
                      <Button variant="secondary" size="sm">
                        Mark as Resolved
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No alerts found matching your criteria.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
