"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Monitor,
  Activity,
  Thermometer,
  Eye,
  TrendingUp,
  Calendar,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

// Mock display data
const getDisplayData = (id: string) => ({
  id,
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
    brightness: 2500,
    refreshRate: "60Hz",
  },
  metrics: {
    impressions: 45230,
    engagement: 12.5,
    revenue: 15600,
    clickThrough: 3.2,
  },
  system: {
    temperature: 42,
    cpuUsage: 35,
    memoryUsage: 68,
    diskUsage: 45,
    signalStrength: 85,
    powerConsumption: 180,
  },
  schedule: [
    {
      id: "1",
      title: "Samsung Galaxy S24 Campaign",
      startTime: "08:00",
      endTime: "18:00",
      duration: "30s",
      status: "active",
    },
    {
      id: "2",
      title: "Jollibee Holiday Special",
      startTime: "18:00",
      endTime: "22:00",
      duration: "15s",
      status: "scheduled",
    },
  ],
  analytics: {
    hourlyViews: [120, 150, 180, 220, 280, 320, 380, 420, 450, 480, 520, 580],
    demographics: {
      age: { "18-24": 25, "25-34": 35, "35-44": 20, "45-54": 15, "55+": 5 },
      gender: { male: 55, female: 45 },
    },
  },
})

export default function DisplayDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [display, setDisplay] = useState(getDisplayData(params.id as string))
  const [isPlaying, setIsPlaying] = useState(display.status === "online")
  const [activeTab, setActiveTab] = useState("overview")

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    setDisplay((prev) => ({ ...prev, status: isPlaying ? "maintenance" : "online" }))
    toast({
      title: isPlaying ? "Display Paused" : "Display Started",
      description: `${display.name} is now ${isPlaying ? "paused" : "playing"}.`,
    })
  }

  const handleReboot = () => {
    toast({
      title: "Rebooting Display",
      description: "The display system is restarting...",
    })
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

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
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
              <h1 className="text-2xl font-bold text-gray-900">{display.name}</h1>
              <p className="text-gray-600">{display.location}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(display.status)}>{display.status}</Badge>
          <Button variant="outline" onClick={handlePlayPause} className="flex items-center gap-2 bg-transparent">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button variant="outline" onClick={handleReboot} className="flex items-center gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Reboot
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(display.health)}`}>
              {display.health.charAt(0).toUpperCase() + display.health.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground">Uptime: {display.uptime}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display.metrics.impressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{display.metrics.engagement}% engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{display.metrics.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{display.metrics.clickThrough}% CTR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display.system.temperature}°C</div>
            <p className="text-xs text-muted-foreground">Normal operating range</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Content */}
            <Card>
              <CardHeader>
                <CardTitle>Current Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={display.thumbnail || "/placeholder.svg"}
                    alt={display.currentContent}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-semibold mb-2">{display.currentContent}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Playing since 08:00</span>
                  <span>Ends at 18:00</span>
                </div>
              </CardContent>
            </Card>

            {/* Display Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Display Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Resolution:</span>
                  <span className="font-medium">{display.specs.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{display.specs.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{display.specs.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Brightness:</span>
                  <span className="font-medium">{display.specs.brightness} nits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Refresh Rate:</span>
                  <span className="font-medium">{display.specs.refreshRate}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {display.schedule.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">
                        {item.startTime} - {item.endTime} ({item.duration})
                      </p>
                    </div>
                    <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Monitor className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Content Management</h3>
                <p className="text-gray-500 mb-4">Upload and manage content for this display.</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500 mb-4">Detailed analytics and reporting will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{display.system.cpuUsage}%</span>
                  </div>
                  <Progress value={display.system.cpuUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{display.system.memoryUsage}%</span>
                  </div>
                  <Progress value={display.system.memoryUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk Usage</span>
                    <span>{display.system.diskUsage}%</span>
                  </div>
                  <Progress value={display.system.diskUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Signal Strength</span>
                    <span>{display.system.signalStrength}%</span>
                  </div>
                  <Progress value={display.system.signalStrength} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Temperature:</span>
                  <span className="font-medium">{display.system.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Power Consumption:</span>
                  <span className="font-medium">{display.system.powerConsumption}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-medium">{display.lastUpdate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium">{display.uptime}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
