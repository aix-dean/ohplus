"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Monitor,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for displays
const mockDisplays = [
  {
    id: "1",
    name: "EDSA Shaw Boulevard",
    location: "Mandaluyong City",
    status: "online",
    health: "excellent",
    currentContent: "Samsung Galaxy S24 Campaign",
    uptime: "99.8%",
    lastUpdate: "2 minutes ago",
    thumbnail: "/led-billboard-1.png",
    specs: {
      resolution: "1920x1080",
      size: "55 inches",
      type: "LED",
    },
    metrics: {
      impressions: 45230,
      engagement: 12.5,
      revenue: 15600,
    },
  },
  {
    id: "2",
    name: "Ayala Triangle Gardens",
    location: "Makati City",
    status: "online",
    health: "good",
    currentContent: "Jollibee Holiday Special",
    uptime: "98.2%",
    lastUpdate: "5 minutes ago",
    thumbnail: "/led-billboard-2.png",
    specs: {
      resolution: "1920x1080",
      size: "65 inches",
      type: "LED",
    },
    metrics: {
      impressions: 38920,
      engagement: 15.2,
      revenue: 12400,
    },
  },
  {
    id: "3",
    name: "BGC Central Square",
    location: "Taguig City",
    status: "maintenance",
    health: "warning",
    currentContent: "System Maintenance",
    uptime: "95.1%",
    lastUpdate: "1 hour ago",
    thumbnail: "/led-billboard-3.png",
    specs: {
      resolution: "1920x1080",
      size: "75 inches",
      type: "LED",
    },
    metrics: {
      impressions: 28150,
      engagement: 8.7,
      revenue: 9200,
    },
  },
  {
    id: "4",
    name: "SM Mall of Asia",
    location: "Pasay City",
    status: "offline",
    health: "critical",
    currentContent: "No Content",
    uptime: "87.3%",
    lastUpdate: "3 hours ago",
    thumbnail: "/led-billboard-4.png",
    specs: {
      resolution: "1920x1080",
      size: "85 inches",
      type: "LED",
    },
    metrics: {
      impressions: 15680,
      engagement: 4.2,
      revenue: 3800,
    },
  },
]

export default function CMSDashboard() {
  const [displays, setDisplays] = useState(mockDisplays)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedDisplay, setSelectedDisplay] = useState<string | null>(null)

  const { user, userData } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Filter displays based on search and status
  const filteredDisplays = displays.filter((display) => {
    const matchesSearch =
      display.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      display.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || display.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate summary metrics
  const totalDisplays = displays.length
  const onlineDisplays = displays.filter((d) => d.status === "online").length
  const totalImpressions = displays.reduce((sum, d) => sum + d.metrics.impressions, 0)
  const totalRevenue = displays.reduce((sum, d) => sum + d.metrics.revenue, 0)

  const handleDisplayAction = (displayId: string, action: string) => {
    const display = displays.find((d) => d.id === displayId)
    if (!display) return

    switch (action) {
      case "view":
        router.push(`/cms/displays/${displayId}`)
        break
      case "edit":
        router.push(`/cms/displays/${displayId}/edit`)
        break
      case "play":
        setDisplays((prev) => prev.map((d) => (d.id === displayId ? { ...d, status: "online" } : d)))
        toast({
          title: "Display Started",
          description: `${display.name} is now playing content.`,
        })
        break
      case "pause":
        setDisplays((prev) => prev.map((d) => (d.id === displayId ? { ...d, status: "maintenance" } : d)))
        toast({
          title: "Display Paused",
          description: `${display.name} has been paused.`,
        })
        break
      case "delete":
        setDisplays((prev) => prev.filter((d) => d.id !== displayId))
        toast({
          title: "Display Removed",
          description: `${display.name} has been removed from the system.`,
        })
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200"
      case "offline":
        return "bg-red-100 text-red-800 border-red-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "excellent":
      case "good":
        return <Activity className="h-4 w-4" />
      case "warning":
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CMS Dashboard</h1>
          <p className="text-gray-600">Manage your digital displays and content</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push("/cms/content/new")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Content
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/cms/displays/new")}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            Add Display
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Displays</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDisplays}</div>
            <p className="text-xs text-muted-foreground">
              {onlineDisplays} online, {totalDisplays - onlineDisplays} offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">6 ending this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search displays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            Grid
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            List
          </Button>
        </div>
      </div>

      {/* Displays Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDisplays.map((display) => (
            <Card key={display.id} className="group hover:shadow-lg transition-all duration-200">
              <div className="relative">
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  <Image
                    src={display.thumbnail || "/placeholder.svg"}
                    alt={display.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className={getStatusColor(display.status)}>{display.status}</Badge>
                </div>
                <div className="absolute top-2 left-2">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm ${getHealthColor(display.health)}`}
                  >
                    {getHealthIcon(display.health)}
                    <span className="text-xs font-medium capitalize">{display.health}</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">{display.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{display.location}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDisplayAction(display.id, "view")}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDisplayAction(display.id, "edit")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {display.status === "online" ? (
                        <DropdownMenuItem onClick={() => handleDisplayAction(display.id, "pause")}>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleDisplayAction(display.id, "play")}>
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDisplayAction(display.id, "delete")}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Current Content:</span>
                    <span className="font-medium truncate max-w-32" title={display.currentContent}>
                      {display.currentContent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Uptime:</span>
                    <span className="font-medium">{display.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Impressions:</span>
                    <span className="font-medium">{display.metrics.impressions.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last update: {display.lastUpdate}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Live</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Display</th>
                    <th className="text-left p-4 font-medium text-gray-900">Status</th>
                    <th className="text-left p-4 font-medium text-gray-900">Health</th>
                    <th className="text-left p-4 font-medium text-gray-900">Current Content</th>
                    <th className="text-left p-4 font-medium text-gray-900">Metrics</th>
                    <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisplays.map((display) => (
                    <tr key={display.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={display.thumbnail || "/placeholder.svg"}
                              alt={display.name}
                              width={48}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{display.name}</div>
                            <div className="text-sm text-gray-500">{display.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(display.status)}>{display.status}</Badge>
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center gap-1 ${getHealthColor(display.health)}`}>
                          {getHealthIcon(display.health)}
                          <span className="text-sm font-medium capitalize">{display.health}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium">{display.currentContent}</div>
                        <div className="text-xs text-gray-500">Uptime: {display.uptime}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{display.metrics.impressions.toLocaleString()} views</div>
                          <div className="text-gray-500">₱{display.metrics.revenue.toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDisplayAction(display.id, "view")}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDisplayAction(display.id, "edit")}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDisplayAction(display.id, display.status === "online" ? "pause" : "play")
                            }
                          >
                            {display.status === "online" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredDisplays.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No displays found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by adding your first display."}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button onClick={() => router.push("/cms/displays/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Display
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
