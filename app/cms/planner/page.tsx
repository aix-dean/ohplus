"use client"

import { useState } from "react"
import { Plus, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

interface ContentEvent {
  id: string
  title: string
  date: Date
  type: string
  status: "Draft" | "In Review" | "Approved" | "Published"
}

const mockContentEvents: ContentEvent[] = [
  { id: "1", title: "Summer Sale Video Ad", date: new Date(2024, 6, 15), type: "Video Ad", status: "In Review" },
  { id: "2", title: "Client Testimonial Series", date: new Date(2024, 6, 20), type: "Social Media", status: "Draft" },
  { id: "3", title: "Industry Whitepaper Release", date: new Date(2024, 6, 30), type: "Document", status: "Approved" },
  { id: "4", title: "Q3 Campaign Launch", date: new Date(2024, 7, 5), type: "Digital Ad", status: "Draft" },
  { id: "5", title: "Holiday Promo Graphics", date: new Date(2024, 7, 10), type: "Graphics", status: "In Review" },
  { id: "6", title: "Blog Post: Future of OOH", date: new Date(2024, 7, 12), type: "Blog Post", status: "Published" },
]

export default function CMSPlannerPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [filterType, setFilterType] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")

  const filteredEvents = mockContentEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "All" || event.type === filterType
    const matchesStatus = filterStatus === "All" || event.status === filterStatus
    const matchesDate = selectedDate ? event.date.toDateString() === selectedDate.toDateString() : true
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Content Planner</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search content..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Type: {filterType} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterType("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Video Ad")}>Video Ad</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Social Media")}>Social Media</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Document")}>Document</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Digital Ad")}>Digital Ad</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Graphics")}>Graphics</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Blog Post")}>Blog Post</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Status: {filterStatus} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Draft")}>Draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("In Review")}>In Review</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Approved")}>Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Published")}>Published</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </div>
        </div>

        {/* Calendar and Event List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Events for {selectedDate ? format(selectedDate, "PPP") : "Selected Date"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.type} - {event.status}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No events for this date.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
