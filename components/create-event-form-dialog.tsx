"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Clock, MapPin, Repeat } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface CreateEventFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  quotation?: any // Optional quotation data to pre-fill
}

export function CreateEventFormDialog({ isOpen, onOpenChange, quotation }: CreateEventFormDialogProps) {
  const { userData } = useAuth()
  const { toast } = useToast()
  const initialEventTitle = `${quotation?.items[0]?.name} Quotation` || "";
  const [formData, setFormData] = useState({
    eventTitle: initialEventTitle,
    startDate: new Date(),
    startTime: "09:00",
    endDate: new Date(),
    endTime: "10:00",
    allDay: false,
    eventType: "Meeting",
    location: "",
    clientName: quotation?.client_name || "",
    description: "",
    repeat: "Does not repeat",
  })

  useEffect(() => {
    if (quotation) {
      setFormData((prev) => ({
        ...prev,
        eventTitle: quotation.items[0]?.name || prev.eventTitle,
        clientName: quotation.client_name || prev.clientName,
      }));
    }
  }, [quotation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleDateChange = (id: string, date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, [id]: date }))
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, allDay: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form Data Submitted:", formData)
    // Here you would typically send this data to your backend or a state management system

    const departments = ["Logistics", "Sales", "Admin", "Finance", "Treasury", "Accounting"]

    for (const department of departments) {
      try {
        await addDoc(collection(db, "notifications"), {
          uid_to: "",
          type: "Quotation",
          viewed: false,
          created: serverTimestamp(),
          company_id: userData?.company_id || "",
          department_from: "Sales",
          department_to: department,
          navigate_to: "",
          title: formData.eventTitle,
          description: `A new event titled '${formData.eventTitle}' has been created by ${userData?.displayName || "Unknown User"} for ${formData.clientName}.`,
        })
      } catch (error) {
        console.error("Error creating notification for department", department, error)
      }
    }

    try {
      const startDateTime = new Date(formData.startDate)
      const [startHours, startMinutes] = formData.startTime.split(":").map(Number)
      startDateTime.setHours(startHours, startMinutes)

      const endDateTime = new Date(formData.endDate)
      const [endHours, endMinutes] = formData.endTime.split(":").map(Number)
      endDateTime.setHours(endHours, endMinutes)

      await addDoc(collection(db, "planner"), {
        allDay: formData.allDay,
        clientId: quotation?.client_id || "",
        clientName: formData.clientName,
        color: "#3b82f6",
        createdAt: serverTimestamp(),
        createdBy: userData?.uid,
        company_id: userData?.company_id,
        description: formData.description,
        end: endDateTime,
        location: formData.location,
        recurrence: formData.repeat,
        start: startDateTime,
        status: "scheduled",
        title: formData.eventTitle,
        type: formData.eventType,
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "Event created successfully!",
        description: "The event has been added to your planner.",
      })
    } catch (error) {
      console.error("Error creating planner document:", error)
      toast({
        title: "Failed to create event",
        description: "There was an error creating the event. Please try again.",
        variant: "destructive",
      })
    }

    onOpenChange(false) // Close dialog after submission
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {formData.eventTitle || "Create New Event"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for your new event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="eventTitle" className="text-sm font-medium">
              Event Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="eventTitle"
              value={formData.eventTitle}
              onChange={handleInputChange}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "MMM d, yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleDateChange("startDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Start Time
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allDay"
                    checked={formData.allDay}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="allDay" className="text-sm font-medium">All day</Label>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  disabled={formData.allDay}
                  className="pr-8"
                />
                <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                    disabled={formData.allDay}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "MMM d, yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => handleDateChange("endDate", date)}
                    initialFocus
                    disabled={formData.allDay}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm font-medium">
                End Time
              </Label>
              <div className="relative">
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  disabled={formData.allDay}
                  className="pr-8"
                />
                <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType" className="text-sm font-medium">
                Event Type
              </Label>
              <Select value={formData.eventType} onValueChange={(value) => handleSelectChange("eventType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Reminder">Reminder</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter location"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-sm font-medium">
              Client Name
            </Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              placeholder="Enter client name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repeat" className="text-sm font-medium flex items-center gap-2">
              <Repeat className="h-4 w-4 text-gray-500" /> Repeat
            </Label>
            <Select value={formData.repeat} onValueChange={(value) => handleSelectChange("repeat", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Does not repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Does not repeat">Does not repeat</SelectItem>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}