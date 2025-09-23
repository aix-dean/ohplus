"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { CalendarIcon, MapPin, Repeat, X } from "lucide-react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { type SalesEvent, type RecurrenceType, createEvent } from "@/lib/planner-service"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  event?: Partial<SalesEvent>
  onEventSaved: (eventId: string) => void
  department: string
}

export function EventDialog({ isOpen, onClose, event, onEventSaved, department }: EventDialogProps) {
  const { user, userData } = useAuth()
  const isEditing = !!event?.id
  const [startDate, setStartDate] = useState<Date | undefined>(event?.start instanceof Date ? event.start : new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(
    event?.end instanceof Date ? event.end : new Date(Date.now() + 60 * 60 * 1000), // Default to 1 hour later
  )
  const [startTime, setStartTime] = useState(
    event?.start instanceof Date ? format(event.start, "HH:mm") : format(new Date(), "HH:mm"),
  )
  const [endTime, setEndTime] = useState(
    event?.end instanceof Date ? format(event.end, "HH:mm") : format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
  )
  const [isAllDay, setIsAllDay] = useState(event?.allDay || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Simplified recurrence state - just the type
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(event?.recurrence?.type || "none")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: event?.title || "",
      location: event?.location || "",
      type: event?.type || "meeting",
      status: event?.status || "scheduled",
      description: event?.description || "",
      color: event?.color || "#3b82f6", // Default blue
    },
  })

  // Reset form when event changes
  useEffect(() => {
    if (isOpen) {
      reset({
        title: event?.title || "",
        location: event?.location || "",
        type: event?.type || "meeting",
        status: event?.status || "scheduled",
        description: event?.description || "",
        color: event?.color || "#3b82f6",
      })

      setStartDate(event?.start instanceof Date ? event.start : new Date())
      setEndDate(event?.end instanceof Date ? event.end : new Date(Date.now() + 60 * 60 * 1000))
      setStartTime(event?.start instanceof Date ? format(event.start, "HH:mm") : format(new Date(), "HH:mm"))
      setEndTime(
        event?.end instanceof Date
          ? format(event.end, "HH:mm")
          : format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
      )
      setIsAllDay(event?.allDay || false)

      // Reset recurrence settings - just the type
      setRecurrenceType(event?.recurrence?.type || "none")
    }
  }, [isOpen, event, reset])

  const onSubmit = async (data: any) => {
    if (!user?.uid || !userData) return


    try {
      setIsSubmitting(true)

      // Combine date and time
      const startDateTime = new Date(startDate!)
      const [startHours, startMinutes] = startTime.split(":").map(Number)
      startDateTime.setHours(startHours, startMinutes, 0, 0)

      const endDateTime = new Date(endDate!)
      const [endHours, endMinutes] = endTime.split(":").map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      // Prepare recurrence data - simplified
      let recurrence = undefined
      if (recurrenceType !== "none") {
        recurrence = {
          type: recurrenceType,
          interval: 1, // Always set to 1
        }
      }

      // Prepare event data
      const eventData = {
        ...data,
        start: startDateTime,
        end: endDateTime,
        allDay: isAllDay,
        recurrence,
      }

      let eventId: string

      if (isEditing && event?.id) {
        // For now, only creation is supported
        throw new Error("Event editing not implemented yet")
      } else {
        // Create new event
        eventId = await createEvent(
          user.uid,
          department, // Fixed department
          userData.role === "admin", // isAdmin
          department, // userDepartment - fixed for planner
          eventData as any
        )
      }

      onEventSaved(eventId)
      onClose()
    } catch (error) {
      console.error("Error saving event:", error)
      alert("Error saving event: " + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md relative sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6">
        <button
          onClick={() => onClose()}
          className="absolute -top-2 -right-2 z-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-semibold">{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto scrollbar-hide space-y-3 px-1">
          {/* Event Information Section */}
          <div className="bg-gray-100 p-3 rounded-lg space-y-1">
            <div className="text-base">
              <span className="font-medium">Department:</span>{" "}
              <span className="capitalize">{department}</span>
            </div>
            <div className="text-base">
              <span className="font-medium">Type:</span>{" "}
              {watch("type") || "Not selected"}
            </div>
            <div className="text-base">
              <span className="font-medium">Status:</span>{" "}
              <span className="capitalize">{watch("status") || "scheduled"}</span>
            </div>
          </div>

          {/* Department Selection for Admin */}
          {department === "admin" && (
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-semibold text-gray-900">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                defaultValue={department}
                onValueChange={(value) => {
                  // For admin, we allow changing the department
                  // This will be passed to the createEvent function
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="treasury">Treasury</SelectItem>
                  <SelectItem value="business-dev">Business Dev</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-900">
                Event Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter event title"
                {...register("title", { required: "Title is required" })}
                className={`h-9 text-sm ${errors.title ? "border-red-500" : ""}`}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message as string}</p>}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal h-9 text-sm", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        // If end date is before start date, update it
                        if (endDate && date && date > endDate) {
                          setEndDate(date)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="startTime" className="text-sm font-semibold text-gray-900">Start Time</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="allDay" checked={isAllDay} onCheckedChange={setIsAllDay} className="h-4 w-4" />
                    <Label htmlFor="allDay" className="text-sm">
                      All day
                    </Label>
                  </div>
                </div>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isAllDay}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal h-9 text-sm", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => (startDate ? date < startDate : false)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-semibold text-gray-900">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isAllDay}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Type and Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-semibold text-gray-900">Event Type</Label>
                <Select
                  defaultValue={watch("type")}
                  onValueChange={(value) => setValue("type", value as SalesEvent["type"])}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold text-gray-900">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="location" placeholder="Enter location" className="pl-8 h-9 text-sm" {...register("location")} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-900">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter event description"
                className="min-h-[80px] text-sm resize-y"
                {...register("description")}
              />
            </div>

            {/* Recurrence - Simplified */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center space-x-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="recurrenceType" className="text-sm font-semibold text-gray-900">Repeat</Label>
              </div>
              <Select value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as RecurrenceType)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-medium">
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </div>

        <style jsx global>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}