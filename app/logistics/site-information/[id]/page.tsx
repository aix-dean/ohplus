import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail } from "lucide-react"
import Link from "next/link"

// This would typically come from your database
async function getServiceAssignment(id: string) {
  // Mock data - replace with actual database call
  const mockData = {
    id,
    saNumber: "SA-2024-001",
    serviceType: "Maintenance",
    status: "Scheduled",
    alarmDate: new Date("2024-01-15"),
    alarmTime: "09:00 AM",
    projectSiteName: "EDSA Billboard Site A",
    assignedTo: "John Doe",
    clientName: "ABC Corporation",
    location: "EDSA Ortigas, Pasig City",
    description: "Regular maintenance check for LED display panels",
    priority: "Medium",
    estimatedDuration: "2 hours",
    contactPerson: "Jane Smith",
    contactPhone: "+63 912 345 6789",
    contactEmail: "jane.smith@abccorp.com",
    notes: "Check all LED panels for proper functionality and clean display surface",
    equipment: ["LED Display Panels", "Control System", "Power Supply"],
    lastService: new Date("2023-12-15"),
  }

  // Simulate not found
  if (id === "not-found") {
    return null
  }

  return mockData
}

export default async function ServiceAssignmentPage({ params }: { params: { id: string } }) {
  const assignment = await getServiceAssignment(params.id)

  if (!assignment) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/logistics/calendar">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Service Assignment Details</h1>
        <p className="text-gray-600">View and manage service assignment information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Service assignment overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">SA Number:</span>
              <span>{assignment.saNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Service Type:</span>
              <span>{assignment.serviceType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Priority:</span>
              <Badge className={getPriorityColor(assignment.priority)}>{assignment.priority}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Estimated Duration:</span>
              <span>{assignment.estimatedDuration}</span>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Information</CardTitle>
            <CardDescription>Date and time details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Date:</span>
              <span>{assignment.alarmDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Time:</span>
              <span>{assignment.alarmTime}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Assigned To:</span>
              <span>{assignment.assignedTo}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Last Service:</span>
              <span>{assignment.lastService.toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Site Information */}
        <Card>
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
            <CardDescription>Location and client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <div>
                <span className="font-medium">Site Name:</span>
                <p>{assignment.projectSiteName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <div>
                <span className="font-medium">Location:</span>
                <p>{assignment.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Client:</span>
              <span>{assignment.clientName}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Client contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Contact Person:</span>
              <span>{assignment.contactPerson}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Phone:</span>
              <a href={`tel:${assignment.contactPhone}`} className="text-blue-600 hover:underline">
                {assignment.contactPhone}
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Email:</span>
              <a href={`mailto:${assignment.contactEmail}`} className="text-blue-600 hover:underline">
                {assignment.contactEmail}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Service details and requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{assignment.description}</p>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
            <CardDescription>Equipment to be serviced</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assignment.equipment.map((item, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{assignment.notes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-4">
        <Button>Update Status</Button>
        <Button variant="outline">Edit Assignment</Button>
        <Button variant="outline">Add Notes</Button>
      </div>
    </div>
  )
}
