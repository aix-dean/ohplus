"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Clock, Play } from "lucide-react"

interface CMSData {
  spots_per_loop?: number
  loops_per_day?: number
  spot_duration?: number
  start_time?: string
  spotsPerLoop?: number
  loopsPerDay?: number
  spotDuration?: number
  startTime?: string
}

interface LoopTimelineProps {
  cmsData: CMSData
}

interface TimelineSpot {
  id: string
  name: string
  startTime: Date
  endTime: Date
  duration: number
  status: "active" | "pending" | "available"
}

export function LoopTimeline({ cmsData }: LoopTimelineProps) {
  // Extract CMS configuration with fallbacks
  const spotsPerLoop = cmsData?.spots_per_loop || cmsData?.spotsPerLoop || 5
  const loopsPerDay = cmsData?.loops_per_day || cmsData?.loopsPerDay || 12
  const spotDuration = cmsData?.spot_duration || cmsData?.spotDuration || 15 // seconds
  const startTimeStr = cmsData?.start_time || cmsData?.startTime || "06:00"

  // Parse start time
  const [startHour, startMinute] = startTimeStr.split(":").map(Number)
  const loopStartTime = new Date()
  loopStartTime.setHours(startHour, startMinute, 0, 0)

  // Calculate total loop duration
  const totalLoopDuration = spotsPerLoop * spotDuration // in seconds
  const loopEndTime = new Date(loopStartTime.getTime() + totalLoopDuration * 1000)

  // Generate mock spots for the timeline
  const generateTimelineSpots = (): TimelineSpot[] => {
    const spots: TimelineSpot[] = []
    let currentTime = new Date(loopStartTime)

    for (let i = 0; i < spotsPerLoop; i++) {
      const spotEndTime = new Date(currentTime.getTime() + spotDuration * 1000)

      spots.push({
        id: `SPOT${String(i + 1).padStart(3, "0")}`,
        name: `Spot ${i + 1}`,
        startTime: new Date(currentTime),
        endTime: new Date(spotEndTime),
        duration: spotDuration,
        status: i < 3 ? "active" : i < 4 ? "pending" : "available",
      })

      currentTime = new Date(spotEndTime)
    }

    return spots
  }

  const timelineSpots = generateTimelineSpots()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "available":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleAddSpot = (spotId: string) => {
    console.log(`Add action for spot: ${spotId}`)
    // Add your spot action logic here
  }

  return (
    <div className="space-y-6">
      {/* Loop Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} />
            Loop Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Spots per Loop:</span>
              <div className="text-lg font-semibold">{spotsPerLoop}</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Loops per Day:</span>
              <div className="text-lg font-semibold">{loopsPerDay}</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Spot Duration:</span>
              <div className="text-lg font-semibold">{spotDuration}s</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Total Loop Duration:</span>
              <div className="text-lg font-semibold">
                {Math.floor(totalLoopDuration / 60)}m {totalLoopDuration % 60}s
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play size={18} />
            First Loop Timeline
          </CardTitle>
          <div className="text-sm text-gray-500">
            Loop runs from {formatTime(loopStartTime)} to {formatTime(loopEndTime)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeline Header */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="font-medium">Start Time: {formatTime(loopStartTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="font-medium">End Time: {formatTime(loopEndTime)}</span>
              </div>
            </div>

            {/* Timeline Spots */}
            <div className="space-y-3">
              {timelineSpots.map((spot, index) => (
                <div
                  key={spot.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Spot Number */}
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-700">{index + 1}</span>
                  </div>

                  {/* Spot Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{spot.name}</h3>
                      <Badge variant="outline" className={getStatusColor(spot.status)}>
                        {spot.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-mono">
                        {formatTime(spot.startTime)} - {formatTime(spot.endTime)}
                      </span>
                      <span className="ml-2">({spot.duration}s duration)</span>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 max-w-xs">
                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          spot.status === "active"
                            ? "bg-green-500"
                            : spot.status === "pending"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        }`}
                        style={{
                          width: `${(spot.duration / totalLoopDuration) * 100}%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white mix-blend-difference">{spot.duration}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 bg-transparent"
                    onClick={() => handleAddSpot(spot.id)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              ))}
            </div>

            {/* Timeline Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Loop Summary</h4>
                  <p className="text-sm text-blue-700">This loop will repeat {loopsPerDay} times throughout the day</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-900">
                    {Math.floor(totalLoopDuration / 60)}:{String(totalLoopDuration % 60).padStart(2, "0")}
                  </div>
                  <div className="text-sm text-blue-700">Total Duration</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoopTimeline
