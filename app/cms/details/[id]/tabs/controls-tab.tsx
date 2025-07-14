"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Power,
  Volume2,
  Sun,
  Monitor,
  Wifi,
  Activity,
  Thermometer,
  Zap,
  RefreshCw,
  Settings,
  AlertTriangle,
} from "lucide-react"
import type { Product } from "@/lib/firebase-service"
import { toast } from "@/hooks/use-toast"

interface ControlsTabProps {
  product: Product
}

interface DisplayStatus {
  power: boolean
  brightness: number
  volume: number
  temperature: number
  uptime: string
  connectionStatus: "online" | "offline" | "unstable"
  lastUpdate: Date
}

export default function ControlsTab({ product }: ControlsTabProps) {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>({
    power: true,
    brightness: 75,
    volume: 50,
    temperature: 42,
    uptime: "72h 15m",
    connectionStatus: "online",
    lastUpdate: new Date(),
  })
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setDisplayStatus((prev) => ({
        ...prev,
        temperature: 40 + Math.random() * 10, // 40-50°C
        lastUpdate: new Date(),
        connectionStatus: Math.random() > 0.1 ? "online" : "unstable", // 90% online
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handlePowerToggle = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setDisplayStatus((prev) => ({
        ...prev,
        power: !prev.power,
        lastUpdate: new Date(),
      }))

      toast({
        title: "Success",
        description: `Display ${displayStatus.power ? "turned off" : "turned on"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle power",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBrightnessChange = async (value: number[]) => {
    const brightness = value[0]
    setDisplayStatus((prev) => ({
      ...prev,
      brightness,
      lastUpdate: new Date(),
    }))

    // Debounced API call would go here
    console.log("Setting brightness to:", brightness)
  }

  const handleVolumeChange = async (value: number[]) => {
    const volume = value[0]
    setDisplayStatus((prev) => ({
      ...prev,
      volume,
      lastUpdate: new Date(),
    }))

    // Debounced API call would go here
    console.log("Setting volume to:", volume)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // Simulate API call to refresh status
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setDisplayStatus((prev) => ({
        ...prev,
        lastUpdate: new Date(),
        temperature: 40 + Math.random() * 10,
        connectionStatus: "online",
      }))

      toast({
        title: "Success",
        description: "Display status refreshed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200"
      case "offline":
        return "bg-red-100 text-red-800 border-red-200"
      case "unstable":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTemperatureStatus = (temp: number) => {
    if (temp > 50) return { color: "text-red-600", status: "High" }
    if (temp > 45) return { color: "text-yellow-600", status: "Warm" }
    return { color: "text-green-600", status: "Normal" }
  }

  const tempStatus = getTemperatureStatus(displayStatus.temperature)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Display Controls</h2>
          <p className="text-gray-600">Monitor and control LED display settings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${displayStatus.power ? "bg-green-100" : "bg-red-100"}`}>
                <Power size={20} className={displayStatus.power ? "text-green-600" : "text-red-600"} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Power Status</p>
                <p className="text-lg font-semibold">{displayStatus.power ? "Online" : "Offline"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wifi size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Connection</p>
                <Badge className={getConnectionStatusColor(displayStatus.connectionStatus)}>
                  {displayStatus.connectionStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Thermometer size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Temperature</p>
                <p className={`text-lg font-semibold ${tempStatus.color}`}>{displayStatus.temperature.toFixed(1)}°C</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-lg font-semibold">{displayStatus.uptime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power & Display Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power size={18} />
              Power & Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Power Control */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Power</Label>
                <p className="text-sm text-gray-600">Turn display on/off</p>
              </div>
              <Button
                variant={displayStatus.power ? "destructive" : "default"}
                onClick={handlePowerToggle}
                disabled={loading}
              >
                <Power size={16} className="mr-2" />
                {displayStatus.power ? "Turn Off" : "Turn On"}
              </Button>
            </div>

            <Separator />

            {/* Brightness Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Brightness</Label>
                <span className="text-sm text-gray-600">{displayStatus.brightness}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Sun size={16} className="text-gray-400" />
                <Slider
                  value={[displayStatus.brightness]}
                  onValueChange={handleBrightnessChange}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={!displayStatus.power}
                />
                <Sun size={20} className="text-gray-600" />
              </div>
            </div>

            <Separator />

            {/* Volume Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Volume</Label>
                <span className="text-sm text-gray-600">{displayStatus.volume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 size={16} className="text-gray-400" />
                <Slider
                  value={[displayStatus.volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={!displayStatus.power}
                />
                <Volume2 size={20} className="text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor size={18} />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Display ID:</span>
                <p className="font-mono font-medium">{product.id}</p>
              </div>
              <div>
                <span className="text-gray-600">Resolution:</span>
                <p className="font-medium">
                  {product.specs_rental?.width || 1920} × {product.specs_rental?.height || 1080}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <p className="font-medium">{product.specs_rental?.location || "Unknown"}</p>
              </div>
              <div>
                <span className="text-gray-600">Last Update:</span>
                <p className="font-medium">{displayStatus.lastUpdate.toLocaleTimeString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Temperature:</span>
                <p className={`font-medium ${tempStatus.color}`}>
                  {displayStatus.temperature.toFixed(1)}°C ({tempStatus.status})
                </p>
              </div>
              <div>
                <span className="text-gray-600">Uptime:</span>
                <p className="font-medium">{displayStatus.uptime}</p>
              </div>
            </div>

            <Separator />

            {/* System Alerts */}
            <div className="space-y-3">
              <Label className="text-base font-medium">System Alerts</Label>
              <div className="space-y-2">
                {displayStatus.temperature > 50 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span className="text-sm text-red-800">High temperature detected</span>
                  </div>
                )}
                {displayStatus.connectionStatus === "unstable" && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <Wifi size={16} className="text-yellow-600" />
                    <span className="text-sm text-yellow-800">Connection unstable</span>
                  </div>
                )}
                {displayStatus.connectionStatus === "online" && displayStatus.temperature <= 50 && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <Activity size={16} className="text-green-600" />
                    <span className="text-sm text-green-800">All systems normal</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={18} />
            Advanced Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" disabled={!displayStatus.power}>
              <Monitor size={16} className="mr-2" />
              Screen Test
            </Button>
            <Button variant="outline" disabled={!displayStatus.power}>
              <Zap size={16} className="mr-2" />
              Restart Display
            </Button>
            <Button variant="outline" disabled={!displayStatus.power}>
              <Settings size={16} className="mr-2" />
              Display Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
