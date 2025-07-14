"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Power,
  Sun,
  Monitor,
  Wifi,
  Activity,
  Thermometer,
  Zap,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/firebase-service"

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
  lastUpdate: string
  errors: string[]
  warnings: string[]
}

export default function ControlsTab({ product }: ControlsTabProps) {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>({
    power: true,
    brightness: 80,
    volume: 65,
    temperature: 42,
    uptime: "72h 15m",
    connectionStatus: "online",
    lastUpdate: new Date().toLocaleTimeString(),
    errors: [],
    warnings: ["High temperature detected"],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { toast } = useToast()

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setDisplayStatus((prev) => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString(),
        temperature: Math.max(35, Math.min(50, prev.temperature + (Math.random() - 0.5) * 2)),
      }))
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handlePowerToggle = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setDisplayStatus((prev) => ({
        ...prev,
        power: !prev.power,
        lastUpdate: new Date().toLocaleTimeString(),
      }))

      toast({
        title: displayStatus.power ? "Display powered off" : "Display powered on",
        description: `Display is now ${displayStatus.power ? "offline" : "online"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle power. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBrightnessChange = async (value: number[]) => {
    const brightness = value[0]
    setDisplayStatus((prev) => ({
      ...prev,
      brightness,
      lastUpdate: new Date().toLocaleTimeString(),
    }))

    // Debounced API call simulation
    setTimeout(() => {
      toast({
        title: "Brightness updated",
        description: `Display brightness set to ${brightness}%`,
      })
    }, 500)
  }

  const handleVolumeChange = async (value: number[]) => {
    const volume = value[0]
    setDisplayStatus((prev) => ({
      ...prev,
      volume,
      lastUpdate: new Date().toLocaleTimeString(),
    }))

    // Debounced API call simulation
    setTimeout(() => {
      toast({
        title: "Volume updated",
        description: `Display volume set to ${volume}%`,
      })
    }, 500)
  }

  const handleRestart = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setDisplayStatus((prev) => ({
        ...prev,
        uptime: "0h 1m",
        temperature: 38,
        errors: [],
        warnings: [],
        lastUpdate: new Date().toLocaleTimeString(),
      }))

      toast({
        title: "Display restarted",
        description: "Display has been successfully restarted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restart display. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshStatus = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setDisplayStatus((prev) => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString(),
        temperature: Math.max(35, Math.min(50, prev.temperature + (Math.random() - 0.5) * 3)),
        connectionStatus: Math.random() > 0.1 ? "online" : "unstable",
      }))

      toast({
        title: "Status refreshed",
        description: "Display status has been updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800"
      case "offline":
        return "bg-red-100 text-red-800"
      case "unstable":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConnectionIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "offline":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "unstable":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Display Controls</h3>
          <p className="text-sm text-muted-foreground">Monitor and control LED display hardware</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshStatus} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Power Status</p>
                <p className={`text-lg font-semibold ${displayStatus.power ? "text-green-600" : "text-red-600"}`}>
                  {displayStatus.power ? "ON" : "OFF"}
                </p>
              </div>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  displayStatus.power ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <Power className={`h-4 w-4 ${displayStatus.power ? "text-green-600" : "text-red-600"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connection</p>
                <div className="flex items-center gap-2">
                  {getConnectionIcon(displayStatus.connectionStatus)}
                  <Badge className={getConnectionStatusColor(displayStatus.connectionStatus)}>
                    {displayStatus.connectionStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Wifi className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p
                  className={`text-lg font-semibold ${
                    displayStatus.temperature > 45
                      ? "text-red-600"
                      : displayStatus.temperature > 40
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  {displayStatus.temperature}°C
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Thermometer className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-lg font-semibold">{displayStatus.uptime}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(displayStatus.errors.length > 0 || displayStatus.warnings.length > 0) && (
        <div className="space-y-2">
          {displayStatus.errors.map((error, index) => (
            <Alert key={`error-${index}`} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ))}
          {displayStatus.warnings.map((warning, index) => (
            <Alert key={`warning-${index}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              Power Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="power-switch">Display Power</Label>
                <p className="text-sm text-muted-foreground">Turn display on/off</p>
              </div>
              <Switch
                id="power-switch"
                checked={displayStatus.power}
                onCheckedChange={handlePowerToggle}
                disabled={isLoading}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Button
                onClick={handleRestart}
                disabled={isLoading || !displayStatus.power}
                className="w-full bg-transparent"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Display
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="brightness">Brightness</Label>
                <span className="text-sm text-muted-foreground">{displayStatus.brightness}%</span>
              </div>
              <Slider
                id="brightness"
                min={0}
                max={100}
                step={1}
                value={[displayStatus.brightness]}
                onValueChange={handleBrightnessChange}
                disabled={!displayStatus.power}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume">Volume</Label>
                <span className="text-sm text-muted-foreground">{displayStatus.volume}%</span>
              </div>
              <Slider
                id="volume"
                min={0}
                max={100}
                step={1}
                value={[displayStatus.volume]}
                onValueChange={handleVolumeChange}
                disabled={!displayStatus.power}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Product ID:</span>
              <p className="font-medium">{product.id?.substring(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>
              <p className="font-medium">{product.specs_rental?.location || "Unknown"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Dimensions:</span>
              <p className="font-medium">
                {product.specs_rental?.width || 12}" × {product.specs_rental?.height || 12}"
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Update:</span>
              <p className="font-medium">{displayStatus.lastUpdate}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Firmware:</span>
              <p className="font-medium">v2.1.4</p>
            </div>
            <div>
              <span className="text-muted-foreground">IP Address:</span>
              <p className="font-medium">192.168.1.100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" disabled={!displayStatus.power}>
              <Play className="h-4 w-4 mr-2" />
              Test Content
            </Button>
            <Button variant="outline" disabled={!displayStatus.power}>
              <Pause className="h-4 w-4 mr-2" />
              Pause Display
            </Button>
            <Button variant="outline" disabled={!displayStatus.power}>
              <Sun className="h-4 w-4 mr-2" />
              Auto Brightness
            </Button>
            <Button variant="outline" disabled={!displayStatus.power}>
              <Zap className="h-4 w-4 mr-2" />
              Power Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
