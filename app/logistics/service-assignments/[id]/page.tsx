"use client"

import { useState } from "react"
import { ArrowLeft, FileText, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

interface ServiceAssignmentDetailsProps {
  params: {
    id: string
  }
}

export default function ServiceAssignmentDetails({ params }: ServiceAssignmentDetailsProps) {
  const [isCompleting, setIsCompleting] = useState(false)

  // Mock data - in real app this would come from API
  const serviceAssignment = {
    id: params.id,
    serviceType: "Installation",
    taggedTo: "JO_0531",
    site: {
      name: "Petplans NB",
      location: "MAN2011",
      image: "/led-billboard-1.png",
    },
    sa: "SA00821",
    startDate: "Jun 1, 2025",
    endDate: "Jun 6, 2025",
    serviceDuration: "5 days",
    content: "Lilo and Stitch",
    materialSpecs: "Material Specs.",
    team: "Team C",
    illuminationNits: "250 Lumens",
    gondola: "Yes",
    technology: "Double Sided",
    sales: "Noemi",
    remarks: "Install only from 6pm to 3:00am in the morning.",
    attachments: [],
    requestedBy: "Mae Tuyan",
    cost: {
      crewFee: 4000,
      overtimeFee: 0,
      transpo: 500,
      tollFee: 500,
      mealAllowance: 600,
      total: 5600,
    },
    status: {
      current: "Created",
      timestamp: "May 25, 2025- 2:00pm",
      completed: false,
    },
  }

  const handleMarkComplete = async () => {
    setIsCompleting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsCompleting(false)
    // In real app, would update status and redirect or refresh
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r min-h-screen p-4">
          {/* Notifications */}
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <Button variant="link" className="text-xs text-blue-600 p-0 h-auto">
                See All
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">To Go</h3>
              <nav className="space-y-1">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Bulletin Board
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Project Tracker
                </Button>
              </nav>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">To Do</h3>
              <nav className="space-y-1">
                <Button variant="ghost" className="w-full justify-start text-sm bg-blue-50 text-blue-700">
                  Service Assignments
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  JOs
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Reports
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Teams and Personnel
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Settings and Config.
                </Button>
              </nav>
            </div>
          </div>

          {/* Intelligence Section */}
          <Card className="mt-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Intelligence ✨</h3>
              </div>
              <div className="h-16 bg-white/20 rounded mb-2"></div>
              <Button variant="ghost" className="text-xs text-white p-0 h-auto">
                See All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Service Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Service Type:</span>
                      <p className="text-sm mt-1">{serviceAssignment.serviceType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Tagged to:</span>
                      <p className="text-sm mt-1">{serviceAssignment.taggedTo}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-4">Project Information</h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Site:</span>
                      <div className="flex items-center gap-3 mt-2">
                        <Image
                          src={serviceAssignment.site.image || "/placeholder.svg"}
                          alt={serviceAssignment.site.name}
                          width={60}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium">{serviceAssignment.site.name}</p>
                          <p className="text-xs text-gray-500">{serviceAssignment.site.location}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Content:</span>
                        <p className="text-sm mt-1">{serviceAssignment.content}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Material Specs:</span>
                        <p className="text-sm mt-1">{serviceAssignment.materialSpecs}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Team:</span>
                        <p className="text-sm mt-1">{serviceAssignment.team}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">SA#:</span>
                        <p className="text-sm mt-1">{serviceAssignment.sa}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Start Date:</span>
                        <p className="text-sm mt-1">{serviceAssignment.startDate}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">End Date:</span>
                        <p className="text-sm mt-1">{serviceAssignment.endDate}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Service Duration:</span>
                        <p className="text-sm mt-1">{serviceAssignment.serviceDuration}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Illumination/ Nits:</span>
                        <p className="text-sm mt-1">{serviceAssignment.illuminationNits}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Gondola:</span>
                        <p className="text-sm mt-1">{serviceAssignment.gondola}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Technology:</span>
                        <p className="text-sm mt-1">{serviceAssignment.technology}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Sales:</span>
                        <p className="text-sm mt-1">{serviceAssignment.sales}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remarks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Remarks:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{serviceAssignment.remarks}</p>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attachments:</CardTitle>
                </CardHeader>
                <CardContent>
                  {serviceAssignment.attachments.length === 0 ? (
                    <p className="text-sm text-gray-500">No attachments.</p>
                  ) : (
                    <div className="space-y-2">
                      {serviceAssignment.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{attachment}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requested By */}
              <Card>
                <CardContent className="p-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Requested By:</span>
                    <p className="text-sm mt-1">{serviceAssignment.requestedBy}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Service Cost */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Cost</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Crew Fee:</span>
                    <span>{serviceAssignment.cost.crewFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Overtime Fee:</span>
                    <span>{serviceAssignment.cost.overtimeFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Transpo:</span>
                    <span>{serviceAssignment.cost.transpo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Toll Fee:</span>
                    <span>{serviceAssignment.cost.tollFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Meal Allowance:</span>
                    <span>{serviceAssignment.cost.mealAllowance}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total:</span>
                    <span>₱{serviceAssignment.cost.total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Status Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Tracker</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{serviceAssignment.status.current}</p>
                      <p className="text-xs text-gray-500">{serviceAssignment.status.timestamp}</p>
                    </div>
                  </div>

                  {!serviceAssignment.status.completed && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleMarkComplete}
                      disabled={isCompleting}
                    >
                      {isCompleting ? "Completing..." : "Mark as Complete"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
