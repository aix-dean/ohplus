"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, FileText, Play, Pause } from "lucide-react"
import { CreateReportDialog } from "@/components/create-report-dialog"

const ledSites = [
  {
    id: "led-content-1",
    name: "EDSA Northbound LED",
    location: "Quezon City",
    type: "LED Billboard",
    status: "Active",
    lastUpdate: "2 hours ago",
    occupancy: "85%",
    revenue: "₱125,000",
    contentStatus: "Playing",
    currentAd: "Coca-Cola Summer Campaign",
  },
  {
    id: "led-content-2",
    name: "BGC Central Display",
    location: "Taguig City",
    type: "LED Display",
    status: "Active",
    lastUpdate: "30 minutes ago",
    occupancy: "78%",
    revenue: "₱95,000",
    contentStatus: "Playing",
    currentAd: "Samsung Galaxy Launch",
  },
  {
    id: "led-content-3",
    name: "Ortigas LED Screen",
    location: "Pasig City",
    type: "Digital Screen",
    status: "Maintenance",
    lastUpdate: "4 hours ago",
    occupancy: "0%",
    revenue: "₱0",
    contentStatus: "Paused",
    currentAd: "No Content",
  },
]

export default function LEDSitesContent() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState("")

  const handleCreateReport = (siteId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedSiteId(siteId)
    setReportDialogOpen(true)
    console.log("Creating report for LED content site:", siteId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">LED Sites - Content</h2>
        <Badge variant="secondary">{ledSites.length} LED Sites</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ledSites.map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{site.name}</CardTitle>
                <Badge
                  variant={site.status === "Active" ? "default" : "destructive"}
                  className={site.status === "Active" ? "bg-green-500" : ""}
                >
                  {site.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {site.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Updated {site.lastUpdate}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {site.occupancy} Occupancy
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  {site.contentStatus === "Playing" ? (
                    <Play className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2 text-red-500" />
                  )}
                  {site.contentStatus}: {site.currentAd}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenue</span>
                  <span className="text-lg font-bold text-green-600">{site.revenue}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={(e) => handleCreateReport(site.id, e)}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <FileText className="h-4 w-4" />
                  Create Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} siteId={selectedSiteId} />
    </div>
  )
}
