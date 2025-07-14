"use client"
import { Button } from "@/components/ui/button"
import { Clock, RotateCcw, Settings } from "lucide-react"
import LoopTimeline from "@/components/loop-timeline"

interface TimelineTabProps {
  cmsData: {
    startTime: string
    endTime: string
    spotDuration: number
    loopsPerDay: number
  }
  productId: string
  companyId: string
  sellerId: string
}

export default function TimelineTab({ cmsData, productId, companyId, sellerId }: TimelineTabProps) {
  // Convert the cmsData format to match what LoopTimeline expects
  const timelineData = {
    start_time: cmsData.startTime,
    end_time: cmsData.endTime,
    spot_duration: cmsData.spotDuration,
    loops_per_day: cmsData.loopsPerDay,
    spots_per_loop: 4, // This will be calculated by LoopTimeline
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={20} />
          <h2 className="text-xl font-semibold">Loop Timeline</h2>
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

      {/* Loop Timeline Component */}
      <div>
        <h3 className="text-lg font-semibold">Content Timeline</h3>
        <p className="text-sm text-muted-foreground">
          Manage content scheduling and loop configuration for this display
        </p>
      </div>

      <LoopTimeline cmsData={timelineData} productId={productId} companyId={companyId} sellerId={sellerId} />
    </div>
  )
}
