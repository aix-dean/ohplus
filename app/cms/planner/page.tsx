"use client"

import { useState } from "react"
import { Calendar, Clock, Plus, Search, MoreVertical, Play, Pause, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

// Mock schedule data
const mockSchedules = [
  {
    id: "1",
    title: "Samsung Galaxy S24 Campaign",
    display: "EDSA Shaw Boulevard",
    startDate: "2024-01-22",
    endDate: "2024-01-28",
    startTime: "08:00",
    endTime: "18:00",
    duration: "30s",
    status: "active",
    priority: "high",
    content: "Samsung Galaxy S24 Campaign",
  },
  {
    id: "2",
    title: "Jollibee Holiday Special",
    display: "Ayala Triangle Gardens",
    startDate: "2024-01-23",
    endDate: "2024-01-30",
    startTime: "18:00",
    endTime: "22:00",
    duration: "15s",
    status: "scheduled",
    priority: "medium",
    content: "Jollibee Holiday Special",
  },
  {
    id: "3",
    title: "Nike Air Max Promotion",
    display: "BGC Central Square",
    startDate: "2024-01-25",
    endDate: "2024-02-05",
    startTime: "10:00",
    endTime: "20:00",
    duration: "45s",
    status: "scheduled",
    priority: "high",
    content: "Nike Air Max Promotion",
  },
]

export default function PlannerPage() {
  const [schedules, setSchedules] = useState(mockSchedules)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [displayFilter, setDisplayFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  const { toast } = useToast()

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.display.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter
    const matchesDisplay = displayFilter === "all" || schedule.display === displayFilter
    return matchesSearch && matchesStatus && matchesDisplay
  })

  const handleScheduleAction = (scheduleId: string, action: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (!schedule) return

    switch (action) {
      case "view":
        toast({
          title: "Schedule Details",
          description: `Viewing details for ${schedule.title}`,
        })
        break
      case "edit":
        toast({
          title: "Edit Schedule",
          description: `Editing ${schedule.title}`,
        })
        break
      case "activate":
        setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, status: "active" } : s)))
        toast({
          title: "Schedule Activated",
          description: `${schedule.title} is now active.`,
        })
        break
      case "pause":
        setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, status: "paused" } : s)))
        toast({
          title: "Schedule Paused",
          description: `${schedule.title} has been paused.`,
        })
        break
      case "delete":
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
        toast({
          title: "Schedule Deleted",
          description: `${schedule.title} has been deleted.`,
        })
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Planner</h1>
          <p className="text-gray-600">Schedule and manage your content across displays</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Calendar className="h-4 w-4" />
            Export Schedule
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.filter((s) => s.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.filter((s) => s.status === "scheduled").length}</div>
            <p className="text-xs text-muted-foreground">Upcoming campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.filter((s) => s.priority === "high").length}</div>
            <p className="text-xs text-muted-foreground">Urgent campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">All time periods</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select value={displayFilter} onValueChange={setDisplayFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Display" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Displays</SelectItem>
              <SelectItem value="EDSA Shaw Boulevard">EDSA Shaw</SelectItem>
              <SelectItem value="Ayala Triangle Gardens">Ayala Triangle</SelectItem>
              <SelectItem value="BGC Central Square">BGC Central</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            Calendar
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "list")} className="space-y-6">
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View Coming Soon</h3>
                <p className="text-gray-500 mb-4">
                  Interactive calendar view for scheduling content will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{schedule.title}</h3>
                        <Badge className={getStatusColor(schedule.status)}>{schedule.status}</Badge>
                        <Badge className={getPriorityColor(schedule.priority)}>{schedule.priority}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Display:</span> {schedule.display}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {schedule.duration}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                        <div>
                          <span className="font-medium">Start Date:</span> {schedule.startDate}
                        </div>
                        <div>
                          <span className="font-medium">End Date:</span> {schedule.endDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {schedule.status === "scheduled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScheduleAction(schedule.id, "activate")}
                          className="flex items-center gap-1"
                        >
                          <Play className="h-4 w-4" />
                          Start
                        </Button>
                      )}
                      {schedule.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScheduleAction(schedule.id, "pause")}
                          className="flex items-center gap-1"
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleScheduleAction(schedule.id, "view")}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleScheduleAction(schedule.id, "edit")}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleScheduleAction(schedule.id, "delete")}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredSchedules.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all" || displayFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first schedule."}
          </p>
          {!searchTerm && statusFilter === "all" && displayFilter === "all" && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
