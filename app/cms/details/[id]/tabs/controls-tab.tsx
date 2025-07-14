"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Power,
  Volume2,
  FlashlightIcon as Brightness4,
  Monitor,
  Wifi,
  HardDrive,
  Thermometer,
  Activity,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/lib/firebase-service"

interface ControlsTabProps {
  product: Product
}

interface DisplayMetrics {
  temperature: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  uptime: string
  signalStrength: number
  lastUpdate: string
}

export default function ControlsTab({ product }: ControlsTabProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [brightness, setBrightness] = useState([75])
  const [volume, setVolume] = useState([60])
  const [powerStatus, setPowerStatus] = useState(true)
  const [autoSchedule, setAutoSchedule] = useState(true)
  const [displayMode, setDisplayMode] = useState("normal")
  const [refreshInterval, setRefreshInterval] = useState(30)

  const [metrics, setMetrics] = useState<DisplayMetrics>({
    temperature: 42,
    cpuUsage: 35,
    memoryUsage: 68,
    diskUsage: 45,
    uptime: "7d 14h 32m",
    signalStrength: 85,
    lastUpdate: new Date().toLocaleTimeString(),
  })

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        temperature: 40 + Math.random() * 10,
        cpuUsage: 30 + Math.random() * 40,
        memoryUsage: 60 + Math.random() * 20,
        diskUsage: 40 + Math.random() * 20,
        signalStrength: 80 + Math.random() * 20,
        lastUpdate: new Date().toLocaleTimeString(),
      }))
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const handlePowerToggle = () => {
    setPowerStatus(!powerStatus)
    toast({
      title: powerStatus ? "Display Powered Off" : "Display Powered On",
      description: powerStatus
        ? "The display has been turned off remotely."
        : "The display has been turned on remotely.",
    })
  }

  const handleBrightnessChange = (value: number[]) => {
    setBrightness(value)
    toast({
      title: "Brightness Updated",
      description: `Display brightness set to ${value[0]}%`,
    })
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    toast({
      title: "Volume Updated",
      description: `Display volume set to ${value[0]}%`,
    })
  }

  const handleReboot = () => {
    toast({
      title: "Reboot Initiated",
      description: "The display system is restarting. This may take a few minutes.",
    })
  }

  const handleRefresh = () => {
    toast({
      title: "Refreshing Display",
      description: "Display content is being refreshed.",
    })
  }

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "text-red-600"
    if (value >= thresholds.warning) return "text-yellow-600"
    return "text-green-600"
  }

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="h-4 w-4 text-red-600" />
    if (value >= thresholds.warning) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Display Controls</h2>
          <p className="text-sm text-gray-500">Monitor and control the LED display system remotely</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power & Display Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Display Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Power Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4" />
                <Label>Power</Label>
              </div>
              <Switch checked={powerStatus} onCheckedChange={handlePowerToggle} disabled={!isOnline} />
            </div>

            {/* Brightness Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brightness4 className="h-4 w-4" />
                  <Label>Brightness</Label>
                </div>
                <span className="text-sm font-medium">{brightness[0]}%</span>
              </div>
              <Slider
                value={brightness}
                onValueChange={handleBrightnessChange}
                max={100}
                step={1}
                disabled={!powerStatus || !isOnline}
                className="w-full"
              />
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <Label>Volume</Label>
                </div>
                <span className="text-sm font-medium">{volume[0]}%</span>
              </div>
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                disabled={!powerStatus || !isOnline}
                className="w-full"
              />
            </div>

            {/* Display Mode */}
            <div className="space-y-2">
              <Label>Display Mode</Label>
              <Select value={displayMode} onValueChange={setDisplayMode} disabled={!powerStatus || !isOnline}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="eco">Eco Mode</SelectItem>
                  <SelectItem value="high_contrast">High Contrast</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Schedule */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label>Auto Schedule</Label>
              </div>
              <Switch checked={autoSchedule} onCheckedChange={setAutoSchedule} disabled={!isOnline} />
            </div>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Temperature */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                <span className="text-sm">Temperature</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(metrics.temperature, { warning: 50, critical: 60 })}
                <span
                  className={`text-sm font-medium ${getMetricColor(metrics.temperature, { warning: 50, critical: 60 })}`}
                >
                  {metrics.temperature.toFixed(1)}°C
                </span>
              </div>
            </div>

            {/* CPU Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="text-sm">CPU Usage</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(metrics.cpuUsage, { warning: 70, critical: 90 })}
                <span
                  className={`text-sm font-medium ${getMetricColor(metrics.cpuUsage, { warning: 70, critical: 90 })}`}
                >
                  {metrics.cpuUsage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm">Memory</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(metrics.memoryUsage, { warning: 80, critical: 95 })}
                <span
                  className={`text-sm font-medium ${getMetricColor(metrics.memoryUsage, { warning: 80, critical: 95 })}`}
                >
                  {metrics.memoryUsage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Disk Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm">Storage</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(metrics.diskUsage, { warning: 80, critical: 95 })}
                <span
                  className={`text-sm font-medium ${getMetricColor(metrics.diskUsage, { warning: 80, critical: 95 })}`}
                >
                  {metrics.diskUsage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Signal Strength */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Signal</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(100 - metrics.signalStrength, { warning: 30, critical: 50 })}
                <span
                  className={`text-sm font-medium ${getMetricColor(100 - metrics.signalStrength, { warning: 30, critical: 50 })}`}
                >
                  {metrics.signalStrength.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Uptime */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Uptime</span>
              </div>
              <span className="text-sm font-medium">{metrics.uptime}</span>
            </div>

            {/* Last Update */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t">Last updated: {metrics.lastUpdate}</div>
          </CardContent>
        </Card>

        {/* System Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={!isOnline}
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Content
              </Button>

              <Button
                variant="outline"
                onClick={() => toast({ title: "Screenshot Captured", description: "Display screenshot saved." })}
                disabled={!powerStatus || !isOnline}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Screenshot
              </Button>

              <Button
                variant="outline"
                onClick={handleReboot}
                disabled={!isOnline}
                className="flex items-center gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Reboot System
              </Button>

              <div className="flex items-center gap-2">
                <Label htmlFor="refresh-interval" className="text-sm">
                  Refresh
                </Label>
                <Input
                  id="refresh-interval"
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number.parseInt(e.target.value) || 30)}
                  min="5"
                  max="300"
                  className="w-16 h-8"
                />
                <span className="text-xs text-gray-500">sec</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
