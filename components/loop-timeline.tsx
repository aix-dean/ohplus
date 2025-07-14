"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Clock, ImageIcon, Video, FileText } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

// Types
interface TimeSlot {
  id: string
  time: string
  duration: number
  content?: {
    id: string
    name: string
    type: "image" | "video" | "text"
    url?: string
    thumbnail?: string
  }
  isEmpty: boolean
}

interface LoopTimelineProps {
  cmsData?: {
    start_time?: string
    end_time?: string
    spot_duration?: number
    loops_per_day?: number
    spots_per_loop?: number
  }
  onUpdateCMS?: (data: any) => void
  readOnly?: boolean
}

// Helper function to calculate spots per loop based on time range and duration
function calculateSpotsPerLoop(startTimeStr = "08:00", endTimeStr = "22:00", spotDurationMinutes = 1): number {
  try {
    // Provide default values if strings are undefined
    const safeStartTime = startTimeStr || "08:00"
    const safeEndTime = endTimeStr || "22:00"

    const [startHour, startMinute] = safeStartTime.split(":").map(Number)
    const [endHour, endMinute] = safeEndTime.split(":").map(Number)

    // Convert to minutes
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    // Calculate total duration in minutes
    const totalMinutes = endMinutes - startMinutes

    // Calculate spots per loop (assuming each loop is 1 hour for simplicity)
    const loopDurationMinutes = 60
    const spotsPerLoop = Math.floor(loopDurationMinutes / spotDurationMinutes)

    return Math.max(1, spotsPerLoop)
  } catch (error) {
    console.error("Error calculating spots per loop:", error)
    return 6 // Default fallback
  }
}

export function LoopTimeline({ cmsData, onUpdateCMS, readOnly = false }: LoopTimelineProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isAddContentOpen, setIsAddContentOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [contentForm, setContentForm] = useState({
    name: "",
    type: "image" as "image" | "video" | "text",
    url: "",
    duration: 30,
  })

  // Safe CMS data extraction with fallbacks
  const startTimeStr = cmsData?.start_time || "08:00"
  const endTimeStr = cmsData?.end_time || "22:00"
  const spotDuration = cmsData?.spot_duration || 30
  const loopsPerDay = cmsData?.loops_per_day || 24
  const spotsPerLoop = cmsData?.spots_per_loop || calculateSpotsPerLoop(startTimeStr, endTimeStr, spotDuration / 60)

  // Generate time slots
  useEffect(() => {
    const generateTimeSlots = () => {
      const slots: TimeSlot[] = []
      const totalSlots = spotsPerLoop

      // Create time slots based on start time and duration
      for (let i = 0; i < totalSlots; i++) {
        const slotTime = calculateSlotTime(startTimeStr, i, spotDuration)
        slots.push({
          id: `slot-${i}`,
          time: slotTime,
          duration: spotDuration,
          isEmpty: true,
        })
      }

      setTimeSlots(slots)
    }

    generateTimeSlots()
  }, [startTimeStr, spotDuration, spotsPerLoop])

  // Calculate slot time
  const calculateSlotTime = (startTime: string, slotIndex: number, duration: number): string => {
    try {
      const [hours, minutes] = startTime.split(":").map(Number)
      const startMinutes = hours * 60 + minutes
      const slotMinutes = startMinutes + (slotIndex * duration) / 60

      const slotHours = Math.floor(slotMinutes / 60) % 24
      const slotMins = Math.floor(slotMinutes % 60)

      return `${slotHours.toString().padStart(2, "0")}:${slotMins.toString().padStart(2, "0")}`
    } catch (error) {
      return "00:00"
    }
  }

  const handleAddContent = () => {
    if (!selectedSlot) return

    const newContent = {
      id: Date.now().toString(),
      name: contentForm.name,
      type: contentForm.type,
      url: contentForm.url,
      thumbnail: contentForm.type === "image" ? contentForm.url : undefined,
    }

    setTimeSlots((prev) =>
      prev.map((slot) => (slot.id === selectedSlot.id ? { ...slot, content: newContent, isEmpty: false } : slot)),
    )

    setIsAddContentOpen(false)
    setSelectedSlot(null)
    setContentForm({ name: "", type: "image", url: "", duration: 30 })

    toast({
      title: "Content Added",
      description: "Content has been added to the timeline slot.",
    })
  }

  const handleRemoveContent = (slotId: string) => {
    setTimeSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, content: undefined, isEmpty: true } : slot)),
    )

    toast({
      title: "Content Removed",
      description: "Content has been removed from the timeline slot.",
    })
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "text":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Loop Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Loop Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Operating Hours</Label>
              <p className="text-lg font-semibold">
                {startTimeStr} - {endTimeStr}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Spot Duration</Label>
              <p className="text-lg font-semibold">{spotDuration}s</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Loops per Day</Label>
              <p className="text-lg font-semibold">{loopsPerDay}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Spots per Loop</Label>
              <p className="text-lg font-semibold">{spotsPerLoop}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`
                    border-2 border-dashed rounded-lg p-4 transition-all
                    ${slot.isEmpty ? "border-gray-300 bg-gray-50 hover:border-gray-400" : "border-blue-300 bg-blue-50"}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {slot.time}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {slot.duration}s
                    </Badge>
                  </div>

                  {slot.isEmpty ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-gray-400 mb-2">Empty Slot</div>
                      {!readOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSlot(slot)
                            setIsAddContentOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Content
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getContentIcon(slot.content?.type || "")}
                        <span className="font-medium truncate">{slot.content?.name}</span>
                      </div>

                      {slot.content?.thumbnail && (
                        <div className="relative h-20 w-full rounded overflow-hidden">
                          <Image
                            src={slot.content.thumbnail || "/placeholder.svg"}
                            alt={slot.content.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {slot.content?.type}
                        </Badge>
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSlot(slot)
                                setContentForm({
                                  name: slot.content?.name || "",
                                  type: slot.content?.type || "image",
                                  url: slot.content?.url || "",
                                  duration: slot.duration,
                                })
                                setIsAddContentOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveContent(slot.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Content Dialog */}
      <Dialog open={isAddContentOpen} onOpenChange={setIsAddContentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSlot?.content ? "Edit Content" : "Add Content"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content-name">Content Name</Label>
              <Input
                id="content-name"
                value={contentForm.name}
                onChange={(e) => setContentForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter content name"
              />
            </div>

            <div>
              <Label htmlFor="content-type">Content Type</Label>
              <Select
                value={contentForm.type}
                onValueChange={(value) => setContentForm((prev) => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="content-url">Content URL</Label>
              <Input
                id="content-url"
                value={contentForm.url}
                onChange={(e) => setContentForm((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="Enter content URL"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddContentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddContent}>{selectedSlot?.content ? "Update" : "Add"} Content</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
