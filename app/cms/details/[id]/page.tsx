"use client"

import { useState } from "react"
import { ArrowLeft, Edit, Trash2, Calendar, List, Wrench, Monitor, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { LoopTimeline } from "@/components/loop-timeline"

export default function CMSDetailsPage({ params }: { params: { id: string } }) {
  const [brightnessValue, setBrightnessValue] = useState([75])
  const [volumeValue, setVolumeValue] = useState([60])

  // Mock CMS data
  const cmsData = {
    id: "CtLuWKfCkOOJmYGNlrp",
    name: "asd",
    description: "asd",
    status: "PENDING",
    type: "RENTAL",
    dimensions: "H: 12 × W: 12",
    created: "July 9, 2025",
    updated: "July 9, 2025",
    spots_per_loop: 5,
    loops_per_day: 20,
    spot_duration: 15,
    start_time: "06:00",
  }

  // Mock program data
  const programData = [
    {
      id: "SPOT001",
      name: "Morning Slot",
      duration: "15 seconds",
      timeSlot: "06:00 AM - 12:00 PM",
      advertiser: "Coca Cola",
      price: "PHP 1,200",
      status: "Active",
    },
    {
      id: "SPOT002",
      name: "Afternoon Slot",
      duration: "30 seconds",
      timeSlot: "12:00 PM - 06:00 PM",
      advertiser: "Samsung",
      price: "PHP 1,800",
      status: "Active",
    },
    {
      id: "SPOT003",
      name: "Evening Slot",
      duration: "15 seconds",
      timeSlot: "06:00 PM - 12:00 AM",
      advertiser: "Nike",
      price: "PHP 2,100",
      status: "Pending",
    },
    {
      id: "SPOT004",
      name: "Late Night Slot",
      duration: "30 seconds",
      timeSlot: "12:00 AM - 06:00 AM",
      advertiser: "-",
      price: "PHP 900",
      status: "Available",
    },
    {
      id: "SPOT005",
      name: "Weekend Special",
      duration: "45 seconds",
      timeSlot: "10:00 AM - 08:00 PM",
      advertiser: "Apple",
      price: "PHP 2,500",
      status: "Active",
    },
    {
      id: "SPOT006",
      name: "Prime Time",
      duration: "20 seconds",
      timeSlot: "07:00 PM - 09:00 PM",
      advertiser: "McDonald's",
      price: "PHP 2,200",
      status: "Pending",
    },
  ]

  // Mock service data
  const serviceData = [
    {
      id: "SA001",
      title: "Routine Maintenance",
      assignedTo: "John Doe",
      date: "2023-05-15",
      status: "Completed",
      notes: "Cleaned display, checked connections, updated firmware...",
    },
    {
      id: "SA002",
      title: "Panel Replacement",
      assignedTo: "Sarah Johnson",
      date: "2023-06-02",
      status: "In Progress",
      notes: "Replacing damaged LED panels on the right side",
    },
    {
      id: "SA003",
      title: "Network Troubleshooting",
      assignedTo: "Mike Chen",
      date: "2023-06-10",
      status: "Scheduled",
      notes: "Investigating intermittent connectivity issues",
    },
    {
      id: "SA004",
      title: "Emergency Repair",
      assignedTo: "Lisa Wong",
      date: "2023-04-28",
      status: "Completed",
      notes: "Fixed power supply issue after storm damage",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
      case "available":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Available</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Completed</Badge>
      case "in progress":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🔄 In Progress</Badge>
      case "scheduled":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">📅 Scheduled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit size={16} className="mr-2" />
              Edit
            </Button>
            <Button variant="destructive">
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Title and Status */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{cmsData.name}</h1>
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">{cmsData.status}</Badge>
          <Badge variant="outline" className="bg-gray-100">
            {cmsData.type}
          </Badge>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Product Image */}
          <div className="lg:col-span-2">
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <img
                src="/placeholder.svg?height=200&width=200"
                alt="CMS Display"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Description and CMS Configuration */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <h3 className="font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-900">{cmsData.description}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-500 mb-2">CMS Configuration</h3>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-sm">Spots per loop: Not specified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-sm">Loops per day: {cmsData.loops_per_day}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ID and Dimensions */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h3 className="font-medium text-gray-500 mb-1">ID</h3>
              <p className="text-gray-900 font-mono text-sm">{cmsData.id}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-500 mb-1">Dimensions</h3>
              <p className="text-gray-900">{cmsData.dimensions}</p>
            </div>

            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Created: {cmsData.created}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Updated: {cmsData.updated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="program" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="program" className="flex items-center gap-2">
              <List size={16} />
              Program List
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-2">
              <Wrench size={16} />
              Service
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2">
              <Monitor size={16} />
              Controls
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock size={16} />
              Loop Timeline
            </TabsTrigger>
          </TabsList>

          {/* Program List Tab */}
          <TabsContent value="program" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6 border-b">
                  <div className="flex items-center gap-2">
                    <List size={18} />
                    <h2 className="text-xl font-semibold">Program List</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <List size={16} className="mr-2" />
                      List
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar size={16} className="mr-2" />
                      Calendar
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programData.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-mono text-sm">{program.id}</TableCell>
                        <TableCell className="font-medium">{program.name}</TableCell>
                        <TableCell>{program.duration}</TableCell>
                        <TableCell className="font-mono text-sm">{program.timeSlot}</TableCell>
                        <TableCell>{program.advertiser}</TableCell>
                        <TableCell className="font-semibold">{program.price}</TableCell>
                        <TableCell>{getStatusBadge(program.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-6 border-t">
                  <Button className="bg-blue-600 hover:bg-blue-700">+ Add Program</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Tab */}
          <TabsContent value="service" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6 border-b">
                  <div className="flex items-center gap-2">
                    <Wrench size={18} />
                    <h2 className="text-xl font-semibold">Service Assignments</h2>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceData.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-mono text-sm">{service.id}</TableCell>
                        <TableCell className="font-medium">{service.title}</TableCell>
                        <TableCell>{service.assignedTo}</TableCell>
                        <TableCell>{service.date}</TableCell>
                        <TableCell>{getStatusBadge(service.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">{service.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-6 border-t">
                  <Button className="bg-blue-600 hover:bg-blue-700">+ Create Service Assignment</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LED Site Status */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor size={18} />
                    <h2 className="text-xl font-semibold">LED Site Status</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Power Status</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">On</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Connection</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Online</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Temperature</span>
                        <div className="text-lg font-semibold text-orange-600">🌡️ 32°C</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Video Source</span>
                        <div className="text-sm text-blue-600">HDMI 1</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Active Content</span>
                        <div className="text-sm text-blue-600">Summer Campaign 2023</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Last Time Sync</span>
                        <div className="text-sm">2023-05-30 08:00 AM</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500">Last Reboot</span>
                      <div className="text-sm">2023-05-30 09:15 AM</div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600">⚠️</span>
                        <span className="text-sm font-medium text-amber-800">Warnings</span>
                      </div>
                      <ul className="mt-2 text-sm text-amber-700">
                        <li>• High temperature detected</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remote Controls */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor size={18} />
                    <h2 className="text-xl font-semibold">⚡ Remote Controls</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-12 bg-transparent">
                        🔌 Power Off
                      </Button>
                      <Button variant="outline" className="h-12 bg-transparent">
                        🔄 Restart Players
                      </Button>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Content Controls</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12 bg-transparent">
                          ⏸️ Pause Content
                        </Button>
                        <Button variant="outline" className="h-12 bg-transparent">
                          🔀 Switch Source
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">System Controls</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12 bg-transparent">
                          🕐 NTP Time Sync
                        </Button>
                        <Button variant="outline" className="h-12 bg-transparent">
                          🔄 Screen Refresh
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Monitoring</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12 bg-transparent">
                          📸 Screenshot
                        </Button>
                        <Button variant="outline" className="h-12 bg-transparent">
                          🔄 Refresh Status
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12 bg-transparent">
                          🧪 Test Pattern
                        </Button>
                        <Button variant="outline" className="h-12 bg-transparent">
                          🏃 Run Diagnostics
                        </Button>
                        <Button variant="outline" className="h-12 bg-transparent">
                          💡 Auto Brightness
                        </Button>
                        <Button variant="outline" className="h-12 bg-transparent">
                          🔄 Sync Playback
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview Section */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Live Preview</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Content
                    </Button>
                    <Button size="sm" variant="default">
                      Display Health
                    </Button>
                    <Button size="sm" variant="outline">
                      Structure
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">May 5, 2025, 1:20 PM</div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { name: "C-5 LED 3.2", health: "100% Healthy" },
                    { name: "D-AVE LED 1.0", health: "100% Healthy" },
                    { name: "MORATA LED 1.0", health: "100% Healthy" },
                    { name: "SLEX LED 2.1", health: "90% Healthy" },
                  ].map((display, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="aspect-video bg-gray-200 rounded mb-2">
                        <img
                          src={`/placeholder.svg?height=120&width=160&query=LED display ${index + 1}`}
                          alt={display.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="text-sm font-medium">{display.name}</div>
                      <div className="text-xs text-green-600">{display.health}</div>
                    </div>
                  ))}
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 mb-4">Create Service Assignment</Button>

                {/* Brightness and Volume Controls */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Brightness Control</span>
                      <span className="text-sm text-gray-500">{brightnessValue[0]}%</span>
                    </div>
                    <Slider
                      value={brightnessValue}
                      onValueChange={setBrightnessValue}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Volume Control</span>
                      <span className="text-sm text-gray-500">{volumeValue[0]}%</span>
                    </div>
                    <Slider value={volumeValue} onValueChange={setVolumeValue} max={100} step={1} className="w-full" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loop Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            <LoopTimeline cmsData={cmsData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
