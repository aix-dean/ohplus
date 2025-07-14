"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Clock, Play, Pause, RotateCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CMSData {
  start_time: string
  end_time: string
  spot_duration: number
  loops_per_day: number
  spots_per_loop?: number
}

interface TimeSlot {
  id: string
  position: number
  content_type: "advertisement" | "content" | "empty"
  title: string
  advertiser?: string
  duration: number
  status: "active" | "scheduled" | "paused"
  start_time: string
  end_time: string
}

interface LoopTimelineProps {
  cmsData: CMSData
  productId: string
  companyId: string
  sellerId: string
}

export default function LoopTimeline({ cmsData, productId, companyId, sellerId }: LoopTimelineProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [currentLoop, setCurrentLoop] = useState(1)
  const [isPlaying, setIsPlaying] = useState(true)

  const [slotForm, setSlotForm] = useState({
    title: "",
    content_type: "advertisement" as "advertisement" | "content" | "empty",
    advertiser: "",
    duration: cmsData.spot_duration || 30,
  })

  // Initialize time slots
  useEffect(() => {
    const spotsPerLoop = cmsData.spots_per_loop || 6
    const initialSlots: TimeSlot[] = []

    for (let i = 0; i < spotsPerLoop; i++) {
      const startMinutes = (i * (cmsData.spot_duration || 30)) / 60
      const endMinutes = ((i + 1) * (cmsData.spot_duration || 30)) / 60

      initialSlots.push({
        id: `slot-${i}`,
        position: i + 1,
        content_type: "empty",
        title: `Slot ${i + 1}`,
        duration: cmsData.spot_duration || 30,
        status: "scheduled",
        start_time: formatTime(startMinutes),
        end_time: formatTime(endMinutes),
      })
    }

    setTimeSlots(initialSlots)
  }, [cmsData])

  // Simulate loop progression
  useEffect(() => {
    if (!isPlaying) return

    const loopDuration = (cmsData.spots_per_loop || 6) * (cmsData.spot_duration || 30) * 1000
    const interval = setInterval(() => {
      setCurrentLoop((prev) => (prev >= cmsData.loops_per_day ? 1 : prev + 1))
    }, loopDuration)

    return () => clearInterval(interval)
  }, [isPlaying, cmsData])

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  const handleAddContent = (position: number) => {
    setSelectedPosition(position)
    setSlotForm({
      title: "",
      content_type: "advertisement",
      advertiser: "",
      duration: cmsData.spot_duration || 30,
    })
    setIsAddDialogOpen(true)
  }

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setSlotForm({
      title: slot.title,
      content_type: slot.content_type,
      advertiser: slot.advertiser || "",
      duration: slot.duration,
    })
    setIsAddDialogOpen(true)
  }

  const handleSaveSlot = () => {
    if (editingSlot) {
      // Update existing slot
      setTimeSlots((prev) =>
        prev.map((slot) =>
          slot.id === editingSlot.id
            ? {
                ...slot,
                title: slotForm.title,
                content_type: slotForm.content_type,
                advertiser: slotForm.advertiser,
                duration: slotForm.duration,
                status: "scheduled",
              }
            : slot,
        ),
      )
      toast({
        title: "Slot Updated",
        description: "Time slot has been updated successfully.",
      })
    } else if (selectedPosition !== null) {
      // Add content to selected position
      setTimeSlots((prev) =>
        prev.map((slot) =>
          slot.position === selectedPosition
            ? {
                ...slot,
                title: slotForm.title,
                content_type: slotForm.content_type,
                advertiser: slotForm.advertiser,
                duration: slotForm.duration,
                status: "scheduled",
              }
            : slot,
        ),
      )
      toast({
        title: "Content Added",
        description: "Content has been added to the timeline.",
      })
    }

    setIsAddDialogOpen(false)
    setEditingSlot(null)
    setSelectedPosition(null)
  }

  const handleRemoveContent = (slotId: string) => {
    setTimeSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              title: `Slot ${slot.position}`,
              content_type: "empty",
              advertiser: undefined,
              status: "scheduled",
            }
          : slot,
      ),
    )
    toast({
      title: "Content Removed",
      description: "Content has been removed from the timeline.",
    })
  }

  const getSlotColor = (slot: TimeSlot) => {
    switch (slot.content_type) {
      case "advertisement":
        return "bg-blue-100 border-blue-300 text-blue-800"
      case "content":
        return "bg-green-100 border-green-300 text-green-800"
      case "empty":
        return "bg-gray-100 border-gray-300 text-gray-600 border-dashed"
      default:
        return "bg-gray-100 border-gray-300 text-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Loop Timeline
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Loop {currentLoop} of {cmsData.loops_per_day}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {timeSlots.map((slot) => (
              <div
                key={slot.id}
                className={`relative border-2 rounded-lg p-4 transition-all hover:shadow-md ${getSlotColor(slot)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Slot {slot.position}</span>
                  <Badge className={getStatusColor(slot.status)} variant="outline">
                    {slot.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm truncate">{slot.title}</h4>

                  {slot.advertiser && <p className="text-xs text-gray-600 truncate">by {slot.advertiser}</p>}

                  <div className="text-xs text-gray-500">
                    <div>
                      {slot.start_time} - {slot.end_time}
                    </div>
                    <div>{slot.duration}s duration</div>
                  </div>

                  <div className="flex items-center gap-1 mt-3">
                    {slot.content_type === "empty" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddContent(slot.position)}
                        className="w-full text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSlot(slot)}
                          className="flex-1 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveContent(slot.id)}
                          className="flex-1 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Content Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Content" : `Add Content to Slot ${selectedPosition}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content-title">Title</Label>
              <Input
                id="content-title"
                value={slotForm.title}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter content title"
              />
            </div>

            <div>
              <Label htmlFor="content-type">Content Type</Label>
              <Select
                value={slotForm.content_type}
                onValueChange={(value) => setSlotForm((prev) => ({ ...prev, content_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {slotForm.content_type === "advertisement" && (
              <div>
                <Label htmlFor="advertiser">Advertiser</Label>
                <Input
                  id="advertiser"
                  value={slotForm.advertiser}
                  onChange={(e) => setSlotForm((prev) => ({ ...prev, advertiser: e.target.value }))}
                  placeholder="Enter advertiser name"
                />
              </div>
            )}

            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={slotForm.duration}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 30 }))}
                min="5"
                max="300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlot}>{editingSlot ? "Update" : "Add"} Content</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
