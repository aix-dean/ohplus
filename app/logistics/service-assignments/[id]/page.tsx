"use client"

import { useState } from "react"
import { ArrowLeft, FileText, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{serviceAssignment.site.name}</h1>
            <p className="text-sm text-gray-500">Service Assignment Details</p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="p-6 pt-0 w-full">
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
