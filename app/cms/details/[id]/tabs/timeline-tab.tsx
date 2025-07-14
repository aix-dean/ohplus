"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import LoopTimeline from "@/components/loop-timeline"
import type { Product } from "@/lib/firebase-service"

interface TimelineTabProps {
  product: Product
  cmsData: any
}

export default function TimelineTab({ product, cmsData }: TimelineTabProps) {
  // Calculate timeline metrics
  const operatingHours = calculateOperatingHours(cmsData.start_time, cmsData.end_time)
  const totalSpotsPerDay = cmsData.loops_per_day * 4 // Assuming 4 spots per loop
  const totalContentTime = (totalSpotsPerDay * cmsData.spot_duration) / 60 // in minutes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Content Timeline</h2>
          <p className="text-sm text-gray-500">Manage content scheduling and loop timeline for this display</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings size={16} className="mr-2" />
            Configure
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw size={16} className="mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Timeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{operatingHours}h</div>
            <div className="text-sm text-gray-500">Operating Hours</div>
            <div className="text-xs text-gray-400 mt-1">
              {cmsData.start_time} - {cmsData.end_time}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{cmsData.loops_per_day}</div>
            <div className="text-sm text-gray-500">Loops per Day</div>
            <div className="text-xs text-gray-400 mt-1">
              Every {Math.round((operatingHours * 60) / cmsData.loops_per_day)} minutes
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{cmsData.spot_duration}s</div>
            <div className="text-sm text-gray-500">Spot Duration</div>
            <div className="text-xs text-gray-400 mt-1">Per advertisement</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{totalSpotsPerDay}</div>
            <div className="text-sm text-gray-500">Total Spots</div>
            <div className="text-xs text-gray-400 mt-1">{Math.round(totalContentTime)} min content</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play size={18} />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Active
              </Badge>
              <div className="text-sm">
                <div className="font-medium">Loop 15 of {cmsData.loops_per_day}</div>
                <div className="text-gray-500">Next loop in 3 minutes</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Pause size={16} className="mr-2" />
                Pause
              </Button>
              <Button variant="outline" size="sm">
                <Play size={16} className="mr-2" />
                Skip to Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loop Timeline Component */}
      <LoopTimeline
        cmsData={cmsData}
        productId={product.id}
        companyId={product.company_id || ""}
        sellerId={product.seller_id || ""}
      />

      {/* Schedule Details */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Operating Schedule</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Start Time:</span>
                    <span className="font-medium">{cmsData.start_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">End Time:</span>
                    <span className="font-medium">{cmsData.end_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Hours:</span>
                    <span className="font-medium">{operatingHours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Days per Week:</span>
                    <span className="font-medium">7 days</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Loop Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loops per Day:</span>
                    <span className="font-medium">{cmsData.loops_per_day}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loop Interval:</span>
                    <span className="font-medium">
                      {Math.round((operatingHours * 60) / cmsData.loops_per_day)} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Spot Duration:</span>
                    <span className="font-medium">{cmsData.spot_duration} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Spots per Loop:</span>
                    <span className="font-medium">4 spots</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to calculate operating hours
function calculateOperatingHours(startTime: string, endTime: string): number {
  const start = parseTime(startTime)
  const end = parseTime(endTime)

  if (end >= start) {
    return end - start
  } else {
    // Handle overnight operation
    return 24 - start + end
  }
}

function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number)
  return hours + (minutes || 0) / 60
}
