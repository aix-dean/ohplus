"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CMSData {
  start_time?: string
  end_time?: string
  spot_duration?: number
  loops_per_day?: number
  spots_per_loop?: number
}

interface TimeSlot {
  id: string
  time: string
  duration: number
  content?: {
    id: string
    title: string
    type: "image" | "video" | "html"
    url?: string
    status: "active" | "scheduled" | "paused"
  }
  status: "occupied" | "available"
}

interface LoopTimelineProps {
  cmsData: CMSData
  productId: string
  companyId: string
  sellerId: string
}

// Safe function to calculate spots per loop with proper error handling
function calculateSpotsPerLoop(cmsData: CMSData): number {
  try {
    // Provide fallback values if data is missing
    const startTimeStr = cmsData?.start_time || "06:00"
    const endTimeStr = cmsData?.end_time || "18:00"
    const spotDuration = cmsData?.spot_duration || 15
    const loopsPerDay = cmsData?.loops_per_day || 20

    // Validate that we have string values before splitting
    if (typeof startTimeStr !== "string" || typeof endTimeStr !== "string") {
      console.warn("Invalid time format in CMS data, using defaults")
      return 4 // Default fallback
    }

    // Parse time strings safely
    const startParts = startTimeStr.split(":")
    const endParts = endTimeStr.split(":")

    if (startParts.length !== 2 || endParts.length !== 2) {
      console.warn("Invalid time format, using default spots per loop")
      return 4
    }

    const [startHour, startMinute] = startParts.map(Number)
    const [endHour, endMinute] = endParts.map(Number)

    // Validate parsed numbers
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      console.warn("Invalid time values, using default spots per loop")
      return 4
    }

    // Calculate total operating minutes
    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute
    const operatingMinutes = endTotalMinutes - startTotalMinutes

    if (operatingMinutes <= 0 || loopsPerDay <= 0 || spotDuration <= 0) {
      return 4 // Default fallback
    }

    // Calculate minutes per loop
    const minutesPerLoop = operatingMinutes / loopsPerDay

    // Calculate spots per loop
    const spotsPerLoop = Math.floor(minutesPerLoop / (spotDuration / 60))

    return Math.max(1, spotsPerLoop) // Ensure at least 1 spot per loop
  } catch (error) {
    console.error("Error calculating spots per loop:", error)
    return 4 // Default fallback
  }
}

export function LoopTimeline({ cmsData, productId, companyId, sellerId }: LoopTimelineProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isAddContentOpen, setIsAddContentOpen] = useState(false)
  const [isEditContentOpen, setIsEditContentOpen] = useState(false)
  const { toast } = useToast()

  // Calculate spots per loop safely
  const spotsPerLoop = calculateSpotsPerLoop(cmsData)

  // Generate time slots based on CMS configuration
  useEffect(() => {
    const generateTimeSlots = () => {
      const slots: TimeSlot[] = []
      const startTime = cmsData?.start_time || "06:00"
      const spotDuration = cmsData?.spot_duration || 15
      const loopsPerDay = cmsData?.loops_per_day || 20

      try {
        // Parse start time safely
        const [startHour, startMinute] = (startTime || "06:00").split(":").map(Number)

        if (isNaN(startHour) || isNaN(startMinute)) {
          console.warn("Invalid start time, using default slots")
          return []
        }

        let currentTime = startHour * 60 + startMinute // Convert to minutes

        for (let loop = 0; loop < loopsPerDay; loop++) {
          for (let spot = 0; spot < spotsPerLoop; spot++) {
            const hours = Math.floor(currentTime / 60)
            const minutes = currentTime % 60
            const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

            slots.push({
              id: `${loop}-${spot}`,
              time: timeString,
              duration: spotDuration,
              status: Math.random() > 0.7 ? "occupied" : "available", // Random for demo
              content:
                Math.random() > 0.7
                  ? {
                      id: `content-${loop}-${spot}`,
                      title: `Ad Content ${loop + 1}-${spot + 1}`,
                      type: Math.random() > 0.5 ? "image" : "video",
                      status: "active",
                    }
                  : undefined,
            })

            currentTime += spotDuration
          }
        }
      } catch (error) {
        console.error("Error generating time slots:", error)
      }

      return slots
    }

    setTimeSlots(generateTimeSlots())
  }, [cmsData, spotsPerLoop])

  const handleAddContent = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setIsAddContentOpen(true)
  }

  const handleEditContent = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setIsEditContentOpen(true)
  }

  const handleDeleteContent = (slot: TimeSlot) => {
    setTimeSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? {
              ...s,
              content: undefined,
              status: "available",
            }
          : s,
      ),
    )
    toast({
      title: "Content removed",
      description: `Content removed from ${slot.time} slot`,
    })
  }

  const handleSaveContent = (contentData: any) => {
    if (!selectedSlot) return

    const newContent = {
      id: `content-${Date.now()}`,
      title: contentData.title,
      type: contentData.type,
      url: contentData.url,
      status: "active" as const,
    }

    setTimeSlots((prev) =>
      prev.map((slot) =>
        slot.id === selectedSlot.id
          ? {
              ...slot,
              content: newContent,
              status: "occupied" as const,
            }
          : slot,
      ),
    )

    toast({
      title: "Content saved",
      description: `Content added to ${selectedSlot.time} slot`,
    })

    setIsAddContentOpen(false)
    setIsEditContentOpen(false)
    setSelectedSlot(null)
  }

  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Loop Timeline Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Operating Hours:</span>
              <p className="font-medium">
                {cmsData?.start_time || "06:00"} - {cmsData?.end_time || "18:00"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Spot Duration:</span>
              <p className="font-medium">{cmsData?.spot_duration || 15}s</p>
            </div>
            <div>
              <span className="text-muted-foreground">Loops per Day:</span>
              <p className="font-medium">{cmsData?.loops_per_day || 20}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Spots per Loop:</span>
              <p className="font-medium">{spotsPerLoop}</p>
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
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {timeSlots.map((slot) => (
              <div
                key={slot.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  slot.status === "occupied"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono">{slot.time}</div>
                  <Badge variant={slot.status === "occupied" ? "default" : "secondary"}>
                    {slot.status === "occupied" ? "Occupied" : "Available"}
                  </Badge>
                  {slot.content && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{slot.content.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {slot.content.type}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {slot.content ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleEditContent(slot)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteContent(slot)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleAddContent(slot)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Content Dialog */}
      <ContentDialog
        open={isAddContentOpen}
        onOpenChange={setIsAddContentOpen}
        onSave={handleSaveContent}
        title="Add Content to Slot"
        slot={selectedSlot}
      />

      {/* Edit Content Dialog */}
      <ContentDialog
        open={isEditContentOpen}
        onOpenChange={setIsEditContentOpen}
        onSave={handleSaveContent}
        title="Edit Content"
        slot={selectedSlot}
        existingContent={selectedSlot?.content}
      />
    </div>
  )
}

// Content Dialog Component
function ContentDialog({
  open,
  onOpenChange,
  onSave,
  title,
  slot,
  existingContent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  title: string
  slot: TimeSlot | null
  existingContent?: any
}) {
  const [formData, setFormData] = useState({
    title: "",
    type: "image",
    url: "",
    description: "",
  })

  useEffect(() => {
    if (existingContent) {
      setFormData({
        title: existingContent.title || "",
        type: existingContent.type || "image",
        url: existingContent.url || "",
        description: existingContent.description || "",
      })
    } else {
      setFormData({
        title: "",
        type: "image",
        url: "",
        description: "",
      })
    }
  }, [existingContent, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {slot && <p className="text-sm text-muted-foreground">Time slot: {slot.time}</p>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Content Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter content title"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Content Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="url">Content URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="Enter content URL"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter content description"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Content</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
