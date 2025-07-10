"use client"

import { useState } from "react"
import { ArrowLeft, FileText, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface ServiceAssignmentDetailsProps {
  params: {
    id: string
  }
}

export default function ServiceAssignmentDetails({ params }: ServiceAssignmentDetailsProps) {
  const router = useRouter()
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
    crew: "Team C",
    illuminationNits: "250 lumens",
    gondola: "Yes",
    technology: "Double Sided",
    sales: "Noemi",
    remarks: "Install only from 6pm to 3:00am in the morning.",
    attachments: [],
    requestedBy: "Mae Tuyan",
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

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="p-1 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Service Assignment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Type and Tagged To */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-sm font-medium text-gray-600">Service Type:</span>
                <p className="text-base font-medium text-red-600 mt-1">{serviceAssignment.serviceType}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Tagged to:</span>
                <p className="text-base font-medium text-blue-600 mt-1">{serviceAssignment.taggedTo}</p>
              </div>
            </div>

            {/* Project Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>

              <div className="grid grid-cols-2 gap-6">
                {/* Site Information */}
                <div>
                  <span className="text-sm font-medium text-gray-600">Site:</span>
                  <Card className="mt-2 p-3 bg-gray-50 border-gray-200">
                    <div className="flex items-center gap-3">
                      <Image
                        src={serviceAssignment.site.image || "/placeholder.svg"}
                        alt={serviceAssignment.site.name}
                        width={60}
                        height={40}
                        className="rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{serviceAssignment.site.name}</p>
                        <p className="text-xs text-gray-500">{serviceAssignment.site.location}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column Details */}
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Content:</span>
                    <p className="text-sm text-gray-900 mt-1">{serviceAssignment.content}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Material Specs:</span>
                    <p className="text-sm text-gray-900 mt-1">{serviceAssignment.materialSpecs}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Crew:</span>
                    <p className="text-sm text-gray-900 mt-1">{serviceAssignment.crew}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Illumination/ Nits:</span>
                    <p className="text-sm text-gray-900 mt-1">{serviceAssignment.illuminationNits}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Gondola:</span>
                    <p className="text-sm text-gray-900 mt-1">{serviceAssignment.gondola}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Technology:</span>
                    <p className="text-sm text-gray-900 mt-1">{serviceAssignment.technology}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Sales:</span>
                    <p className="text-sm text-gray-900 mt-1">{serviceAssignment.sales}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-sm font-medium text-gray-600">SA#:</span>
                <p className="text-sm text-gray-900 mt-1">{serviceAssignment.sa}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Service Duration:</span>
                <p className="text-sm text-gray-900 mt-1">{serviceAssignment.serviceDuration}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Start Date:</span>
                <p className="text-sm text-gray-900 mt-1">{serviceAssignment.startDate}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">End Date:</span>
                <p className="text-sm text-gray-900 mt-1">{serviceAssignment.endDate}</p>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <span className="text-sm font-medium text-gray-600">Remarks:</span>
              <Card className="mt-2 p-4 bg-gray-50 border-gray-200">
                <p className="text-sm text-gray-700">{serviceAssignment.remarks}</p>
              </Card>
            </div>

            {/* Attachments */}
            <div>
              <span className="text-sm font-medium text-gray-600">Attachments:</span>
              <div className="mt-2">
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
              </div>
            </div>

            {/* Requested By */}
            <div>
              <span className="text-sm font-medium text-gray-600">Requested By:</span>
              <p className="text-sm text-gray-900 mt-1">{serviceAssignment.requestedBy}</p>
            </div>
          </div>

          {/* Right Sidebar - Status Tracker */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Tracker</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{serviceAssignment.status.current}</p>
                    <p className="text-xs text-gray-500">{serviceAssignment.status.timestamp}</p>
                  </div>
                </div>

                {!serviceAssignment.status.completed && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleMarkComplete}
                    disabled={isCompleting}
                  >
                    {isCompleting ? "Completing..." : "Mark as Complete"}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
