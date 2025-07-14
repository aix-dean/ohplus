"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import LoopTimeline from "@/components/loop-timeline"

interface TimelineTabProps {
  cmsData: {
    startTime: string
    endTime: string
    spotDuration: number
    loopsPerDay: number
  }
  productId: string
  companyId?: string
  sellerId?: string
}

export default function TimelineTab({ cmsData, productId, companyId, sellerId }: TimelineTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={18} />
          Loop Timeline Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LoopTimeline
          cmsData={{
            end_time: cmsData.endTime,
            loops_per_day: cmsData.loopsPerDay,
            spot_duration: cmsData.spotDuration,
            start_time: cmsData.startTime,
          }}
          productId={productId}
          companyId={companyId}
          sellerId={sellerId}
        />
      </CardContent>
    </Card>
  )
}
