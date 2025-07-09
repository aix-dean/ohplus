import type React from "react"
import { Clock, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface CMSData {
  start_time?: string
  end_time?: string
  spot_duration?: number
  loops_per_day?: number
  spots_per_loop?: number
}

interface LoopTimelineProps {
  cmsData: CMSData
}

const LoopTimeline: React.FC<LoopTimelineProps> = ({ cmsData }) => {
  if (!cmsData) {
    return <p>No CMS data available.</p>
  }

  const { start_time, spot_duration, spots_per_loop } = cmsData

  // Helper function to parse time string to minutes
  const parseTimeToMinutes = (time: string | undefined): number => {
    if (!time) return 0
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Helper function to format minutes back to time string
  const formatMinutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const formattedHours = String(hours).padStart(2, "0")
    const formattedMinutes = String(minutes).padStart(2, "0")
    return `${formattedHours}:${formattedMinutes}`
  }

  const startTimeMinutes = parseTimeToMinutes(start_time)
  const totalLoopDuration = (spot_duration || 0) * (spots_per_loop || 0)
  const firstLoopEndTimeMinutes = startTimeMinutes + totalLoopDuration
  const firstLoopEndTime = formatMinutesToTime(firstLoopEndTimeMinutes)

  const spots = Array.from({ length: spots_per_loop || 0 }, (_, index) => ({
    id: index + 1,
    startTime: formatMinutesToTime(startTimeMinutes + index * (spot_duration || 0)),
    endTime: formatMinutesToTime(startTimeMinutes + (index + 1) * (spot_duration || 0)),
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-gray-500" />
        <span className="text-sm font-medium">Start Time:</span>
        <Badge variant="secondary">{start_time || "N/A"}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-gray-500" />
        <span className="text-sm font-medium">First Loop End Time:</span>
        <Badge variant="secondary">{firstLoopEndTime || "N/A"}</Badge>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">Spots:</h4>
        {spots.map((spot) => (
          <div key={spot.id} className="flex items-center justify-between p-2 border rounded-md">
            <div>
              <span className="text-xs font-medium">Spot {spot.id}:</span>
              <span className="text-xs text-gray-500">
                {spot.startTime} - {spot.endTime}
              </span>
            </div>
            <Button size="icon">
              <Plus size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoopTimeline
