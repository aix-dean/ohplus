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
  const spotsPerLoop = cmsData?.spots_per_loop || cmsData?.spotsPerLoop || 6
  const loopsPerDay = cmsData?.loops_per_day || cmsData?.loopsPerDay || 20
  const spotDuration = cmsData?.spot_duration || cmsData?.spotDuration || 15 // seconds
  const startTimeStr = cmsData?.start_time || cmsData?.startTime || "06:00"

  // Convert military time to 12-hour format
  const convertTo12Hour = (militaryTime: string) => {
    const [hours, minutes] = militaryTime.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Parse start time
  const [startHour, startMinute] = startTimeStr.split(":").map(Number)
  const dayStartTime = new Date()
  dayStartTime.setHours(startHour, startMinute, 0, 0)

  // Calculate total minutes in a day and time per loop
  const totalMinutesInDay = 24 * 60 // 1440 minutes
  const minutesPerLoop = totalMinutesInDay / loopsPerDay

  // Generate timeline spots based on loops per day
  const generateTimelineSpots = (): TimelineSpot[] => {
    const spots: TimelineSpot[] = []
    let currentTime = new Date(dayStartTime)

    for (let i = 0; i < loopsPerDay; i++) {
      const loopEndTime = new Date(currentTime.getTime() + minutesPerLoop * 60 * 1000)

      spots.push({
        id: `LOOP${String(i + 1).padStart(3, "0")}`,
        name: `Loop ${i + 1}`,
        startTime: new Date(currentTime),
        endTime: new Date(loopEndTime),
        duration: Math.round(minutesPerLoop * 60), // Convert to seconds
        status: i < 8 ? "active" : i < 12 ? "pending" : "available",
      })

      currentTime = new Date(loopEndTime)
    }

    return spots
  }

  const timelineSpots = generateTimelineSpots()

  // Calculate total loop duration for the entire day
  const totalDayDuration = loopsPerDay * minutesPerLoop * 60 // in seconds

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
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
    console.log(`Add action for loop: ${spotId}`)
    // Add your spot action logic here
  }

  return (
    <div className="space-y-6">
      {/* Loop Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} />
            Daily Loop Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Spots per Loop:</span>
              <div className="text-lg font-semibold">{spotsPerLoop}</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Total Loops per Day:</span>
              <div className="text-lg font-semibold">{loopsPerDay}</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Spot Duration:</span>
              <div className="text-lg font-semibold">{spotDuration}s</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Start Time:</span>
              <div className="text-lg font-semibold">{convertTo12Hour(startTimeStr)}</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Time per Loop:</span>
              <div className="text-lg font-semibold">{Math.round(minutesPerLoop)} minutes</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Total Daily Spots:</span>
              <div className="text-lg font-semibold">{loopsPerDay * spotsPerLoop}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play size={18} />
            Daily Loop Timeline ({loopsPerDay} Loops)
          </CardTitle>
          <div className="text-sm text-gray-500">
            Daily schedule from {convertTo12Hour(startTimeStr)} with {loopsPerDay} loops throughout the day
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeline Header */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="font-medium">Start: {convertTo12Hour(startTimeStr)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {loopsPerDay} loops × {Math.round(minutesPerLoop)} min each
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="font-medium">End: {formatTime(timelineSpots[timelineSpots.length - 1]?.endTime)}</span>
              </div>
            </div>

            {/* Timeline Spots */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {timelineSpots.map((spot, index) => (
                <div
                  key={spot.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Loop Number */}
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-700">{index + 1}</span>
                  </div>

                  {/* Loop Details */}
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
                      <span className="ml-2">({formatDuration(spot.duration)})</span>
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
                          width: `${(spot.duration / (minutesPerLoop * 60)) * 100}%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white mix-blend-difference">
                          {Math.round(minutesPerLoop)}m
                        </span>
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
                  <h4 className="font-medium text-blue-900">Daily Schedule Summary</h4>
                  <p className="text-sm text-blue-700">
                    {loopsPerDay} loops running throughout the day, each containing {spotsPerLoop} advertising spots
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-900">{loopsPerDay * spotsPerLoop}</div>
                  <div className="text-sm text-blue-700">Total Daily Spots</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Active Loops:</span>
                  <span className="ml-1">{timelineSpots.filter((s) => s.status === "active").length}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Pending Loops:</span>
                  <span className="ml-1">{timelineSpots.filter((s) => s.status === "pending").length}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Available Loops:</span>
                  <span className="ml-1">{timelineSpots.filter((s) => s.status === "available").length}</span>
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
