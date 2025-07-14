"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import {
  Settings,
  Power,
  RotateCcw,
  Pause,
  Play,
  ToggleLeft,
  Timer,
  RefreshCw,
  Camera,
  TestTube,
  Sun,
  Volume2,
  Monitor,
  Wifi,
  Thermometer,
  Activity,
} from "lucide-react"
import type { Product } from "@/lib/firebase-service"

interface ControlsTabProps {
  product: Product
}

export default function ControlsTab({ product }: ControlsTabProps) {
  const [brightness, setBrightness] = useState([75])
  const [volume, setVolume] = useState([60])
  const [autoMode, setAutoMode] = useState(true)
  const [powerStatus, setPowerStatus] = useState(true)

  // Mock LED status data
  const ledStatus = {
    powerStatus: powerStatus ? "On" : "Off",
    temperature: "32°C",
    connection: "Online",
    videoSource: "HDMI 1",
    activeContent: "Current Campaign",
    lastReboot: new Date().toLocaleDateString() + " 09:15 AM",
    lastTimeSync: new Date().toLocaleDateString() + " 08:00 AM",
    warnings:
      product.specs_rental?.elevation && product.specs_rental.elevation > 100 ? ["High elevation detected"] : [],
    uptime: "15 days, 8 hours",
    signalStrength: "Excellent",
    memoryUsage: "68%",
    cpuUsage: "45%",
  }

  // Mock live preview data
  const livePreview = [
    {
      id: `${product.name?.substring(0, 10) || "LED"} 3.2`,
      health: "100% Healthy",
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: `${product.specs_rental?.location?.substring(0, 10) || "SITE"} 1.0`,
      health: "100% Healthy",
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: "BACKUP LED 1.0",
      health: "100% Healthy",
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: "MAIN LED 2.1",
      health: product.active ? "100% Healthy" : "90% Healthy",
      image: "/placeholder.svg?height=100&width=150",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings size={20} />
        <h2 className="text-xl font-semibold">LED Display Controls</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={18} />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Power size={16} className={powerStatus ? "text-green-500" : "text-red-500"} />
                  <span className="text-sm font-medium">Power Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={powerStatus ? "default" : "destructive"}>{ledStatus.powerStatus}</Badge>
                  <Switch checked={powerStatus} onCheckedChange={setPowerStatus} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-green-500" />
                  <span className="text-sm font-medium">Connection</span>
                </div>
                <Badge variant="default">{ledStatus.connection}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-blue-500" />
                  <span className="text-sm font-medium">Temperature</span>
                </div>
                <span className="text-sm">{ledStatus.temperature}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-purple-500" />
                  <span className="text-sm font-medium">Video Source</span>
                </div>
                <span className="text-sm">{ledStatus.videoSource}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Uptime</span>
                <span className="text-sm font-medium">{ledStatus.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Signal Strength</span>
                <span className="text-sm font-medium">{ledStatus.signalStrength}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Memory Usage</span>
                <span className="text-sm font-medium">{ledStatus.memoryUsage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">CPU Usage</span>
                <span className="text-sm font-medium">{ledStatus.cpuUsage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Last Time Sync</span>
                <span className="text-sm font-medium">{ledStatus.lastTimeSync}</span>
              </div>
            </div>

            {ledStatus.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <span className="text-sm font-medium">⚠ Warnings</span>
                </div>
                <ul className="mt-1 text-sm text-yellow-700">
                  {ledStatus.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remote Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power size={18} />
              Remote Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Power Controls */}
            <div>
              <h4 className="font-medium mb-3">Power Controls</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={() => setPowerStatus(false)}
                >
                  <Power size={16} />
                  Power Off
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <RotateCcw size={16} />
                  Restart
                </Button>
              </div>
            </div>

            <Separator />

            {/* Content Controls */}
            <div>
              <h4 className="font-medium mb-3">Content Controls</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Pause size={16} />
                  Pause
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Play size={16} />
                  Resume
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <ToggleLeft size={16} />
                  Switch Source
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <RefreshCw size={16} />
                  Refresh
                </Button>
              </div>
            </div>

            <Separator />

            {/* System Controls */}
            <div>
              <h4 className="font-medium mb-3">System Controls</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Timer size={16} />
                  Time Sync
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Camera size={16} />
                  Screenshot
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <TestTube size={16} />
                  Test Pattern
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <RefreshCw size={16} />
                  Diagnostics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Display Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brightness Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun size={18} />
              Brightness Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Brightness Level</Label>
                <span className="text-sm font-medium">{brightness[0]}%</span>
              </div>
              <Slider value={brightness} onValueChange={setBrightness} max={100} step={1} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-brightness">Auto Brightness</Label>
              <Switch id="auto-brightness" checked={autoMode} onCheckedChange={setAutoMode} />
            </div>
          </CardContent>
        </Card>

        {/* Volume Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 size={18} />
              Volume Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Volume Level</Label>
                <span className="text-sm font-medium">{volume[0]}%</span>
              </div>
              <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Mute</span>
                <span>50%</span>
                <span>Max</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setVolume([0])}>
                Mute
              </Button>
              <Button variant="outline" size="sm" onClick={() => setVolume([50])}>
                50%
              </Button>
              <Button variant="outline" size="sm" onClick={() => setVolume([100])}>
                Max
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera size={18} />
            Live Preview
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Live Feed
            </Badge>
            <span>{new Date().toLocaleString()}</span>
            <Button size="sm" variant="outline">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {livePreview.map((preview) => (
              <div key={preview.id} className="text-center space-y-2">
                <div className="bg-gray-100 rounded-lg p-2 aspect-video">
                  <Image
                    src={preview.image || "/placeholder.svg"}
                    alt={preview.id}
                    width={150}
                    height={100}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{preview.id}</p>
                  <Badge variant={preview.health.includes("100%") ? "default" : "secondary"} className="text-xs">
                    {preview.health}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
