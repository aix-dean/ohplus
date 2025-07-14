"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Power, RotateCcw, Pause, Play, Camera, RefreshCw, Settings, Monitor, Volume2, Sun } from "lucide-react"
import type { Product } from "@/lib/firebase-service"

interface ControlsTabProps {
  product: Product
}

export default function ControlsTab({ product }: ControlsTabProps) {
  // Mock LED status - in real app, this would come from IoT devices
  const ledStatus = {
    powerStatus: "Online",
    temperature: "32°C",
    connection: "Connected",
    videoSource: "HDMI 1",
    activeContent: "Current Campaign",
    lastReboot: new Date().toLocaleDateString() + " 09:15 AM",
    lastSync: new Date().toLocaleDateString() + " 08:00 AM",
    warnings:
      product.specs_rental?.elevation && product.specs_rental.elevation > 100 ? ["High elevation detected"] : [],
  }

  return (
    <div className="space-y-6">
      {/* LED Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor size={18} />
            LED Display Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Power Status</span>
              </div>
              <p className="text-sm text-gray-600">{ledStatus.powerStatus}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Connection</span>
              </div>
              <p className="text-sm text-gray-600">{ledStatus.connection}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Temperature</span>
              <p className="text-sm text-gray-600">{ledStatus.temperature}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Video Source</span>
              <p className="text-sm text-gray-600">{ledStatus.videoSource}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Active Content</span>
              <p className="text-sm text-blue-600">{ledStatus.activeContent}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Last Sync</span>
              <p className="text-sm text-gray-600">{ledStatus.lastSync}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Last Reboot</span>
              <p className="text-sm text-gray-600">{ledStatus.lastReboot}</p>
            </div>
          </div>

          {ledStatus.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <span className="text-sm font-medium">⚠ System Warnings</span>
              </div>
              <ul className="text-sm text-yellow-700">
                {ledStatus.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remote Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={18} />
              System Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Power size={16} />
                Power Off
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <RotateCcw size={16} />
                Restart
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Pause size={16} />
                Pause
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Play size={16} />
                Resume
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Camera size={16} />
                Screenshot
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <RefreshCw size={16} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun size={18} />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Brightness</span>
                <span className="text-sm text-gray-500">75%</span>
              </div>
              <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Volume2 size={16} />
                  Volume
                </span>
                <span className="text-sm text-gray-500">60%</span>
              </div>
              <Slider defaultValue={[60]} max={100} step={1} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
