"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Calendar, Clock, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesChatWidget } from "@/components/sales-chat-widget"

export default function ProjectMonitoringDetailsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  // Mock data - replace with actual data fetching
  const projectData = {
    id: "PM-001",
    name: "Guadalupe Viejo Billboard Installation",
    location: "3179 Kalayaan Ave, Makati, 1213 Metro Manila, Philippines",
    status: "In Progress",
    priority: "High",
    startDate: "2025-09-01",
    endDate: "2025-09-15",
    progress: 65,
    assignedTeam: "Team Alpha",
    jobOrders: 4,
    lastActivity: "2025-09-02 11:30 AM",
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{projectData.name}</h1>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {projectData.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(projectData.priority)}>{projectData.priority} Priority</Badge>
            <Badge className={getStatusColor(projectData.status)}>{projectData.status}</Badge>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Project Info */}
          <aside className="lg:col-span-1">
            <Card className="rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Project ID</span>
                  <span className="text-sm font-semibold">{projectData.id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Assigned Team</span>
                  <span className="text-sm font-semibold flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {projectData.assignedTeam}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Job Orders</span>
                  <span className="text-sm font-semibold flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {projectData.jobOrders}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Start Date</span>
                    <span className="text-sm font-semibold flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(projectData.startDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">End Date</span>
                    <span className="text-sm font-semibold flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(projectData.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Progress</span>
                    <span className="text-sm font-semibold">{projectData.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${projectData.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Last Activity</span>
                  <span className="text-sm font-semibold flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {projectData.lastActivity}
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right Content - Tabbed Interface */}
          <section className="lg:col-span-2">
            <Card className="rounded-xl shadow-sm border border-gray-200">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 rounded-t-xl">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    <TabsContent value="overview" className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Project Overview</h3>
                        <p className="text-gray-600 leading-relaxed">
                          This project involves the installation of a new billboard at Guadalupe Viejo location. The
                          project includes site preparation, structural installation, electrical connections, and final
                          testing. The team is currently working on the structural installation phase.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Total Budget</span>
                              <span className="text-lg font-bold text-green-600">₱250,000</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Spent</span>
                              <span className="text-lg font-bold text-blue-600">₱162,500</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="space-y-4">
                      <h3 className="text-lg font-semibold mb-3">Project Timeline</h3>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium">Site Survey Completed</p>
                            <p className="text-sm text-gray-600">September 1, 2025 - 9:00 AM</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium">Materials Delivered</p>
                            <p className="text-sm text-gray-600">September 1, 2025 - 2:00 PM</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium">Structural Installation (In Progress)</p>
                            <p className="text-sm text-gray-600">September 2, 2025 - 8:00 AM</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium text-gray-500">Electrical Installation</p>
                            <p className="text-sm text-gray-400">Scheduled for September 5, 2025</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4">
                      <h3 className="text-lg font-semibold mb-3">Team Members</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              JD
                            </div>
                            <div>
                              <p className="font-medium">John Doe</p>
                              <p className="text-sm text-gray-600">Project Manager</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              MS
                            </div>
                            <div>
                              <p className="font-medium">Maria Santos</p>
                              <p className="text-sm text-gray-600">Site Engineer</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4">
                      <h3 className="text-lg font-semibold mb-3">Project Documents</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">Site Survey Report</p>
                              <p className="text-sm text-gray-600">PDF • 2.4 MB</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium">Installation Blueprint</p>
                              <p className="text-sm text-gray-600">PDF • 5.1 MB</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <SalesChatWidget />
    </div>
  )
}
