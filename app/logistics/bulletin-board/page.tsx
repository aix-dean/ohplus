"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, MapPin, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock data for sites - in a real app, this would come from your database
const mockSites = [
  {
    id: "QU-SU-LS-0014-060525",
    name: "Lilo & Stitch",
    location: "Petplans Southbound",
    lastActivity: "5/6/25: 5:00AM - Arrival of FA to site",
    activities: [
      "5/6/25: 5:00AM - Reported Bad Weather as cause",
      "5/3/25: 1:30PM - Contacted Team C for installation",
    ],
    status: "active",
    type: "LED",
  },
  {
    id: "QU-SU-LS-0014-060525-2",
    name: "Fairy Skin",
    location: "Bocaue 1.1",
    lastActivity: "5/6/25: 5:00AM - Arrival of FA to site",
    activities: [
      "5/6/25: 5:00AM - Reported Bad Weather as cause",
      "5/3/25: 1:30PM - Contacted Team C for installation",
    ],
    status: "active",
    type: "Static",
  },
  {
    id: "QU-SU-LS-0014-060525-3",
    name: "FUNalo",
    location: "Bocaue 2.1",
    lastActivity: "5/6/25: 5:00AM - Arrival of FA to site",
    activities: [
      "5/6/25: 5:00AM - Reported Bad Weather as cause",
      "5/3/25: 1:30PM - Contacted Team C for installation",
    ],
    status: "active",
    type: "LED",
  },
  {
    id: "BUC-001",
    name: "Building Under Construction",
    location: "Site A",
    lastActivity: "Under Development",
    activities: ["Site preparation in progress"],
    status: "construction",
    type: "BUC",
  },
  {
    id: "BUC-002",
    name: "Building Under Construction",
    location: "Site B",
    lastActivity: "Under Development",
    activities: ["Site preparation in progress"],
    status: "construction",
    type: "BUC",
  },
  {
    id: "BUC-003",
    name: "Building Under Construction",
    location: "Site C",
    lastActivity: "Under Development",
    activities: ["Site preparation in progress"],
    status: "construction",
    type: "BUC",
  },
]

export default function BulletinBoardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSite, setSelectedSite] = useState("all")

  const filteredSites = mockSites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSite = selectedSite === "all" || site.type.toLowerCase() === selectedSite.toLowerCase()
    return matchesSearch && matchesSite
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "construction":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCardHeaderColor = (name: string) => {
    if (name === "Lilo & Stitch") return "bg-cyan-500"
    if (name === "Fairy Skin") return "bg-pink-500"
    if (name === "FUNalo") return "bg-gray-800"
    return "bg-blue-500"
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/logistics/dashboard">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Project Bulletins
          </Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            <SelectItem value="led">LED Sites</SelectItem>
            <SelectItem value="static">Static Sites</SelectItem>
            <SelectItem value="buc">Under Construction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSites.map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className={`${getCardHeaderColor(site.name)} text-white p-4`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">{site.name}</CardTitle>
                {site.type === "BUC" && (
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    BUC
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <MapPin className="h-4 w-4" />
                {site.location}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Site ID:</span> {site.id}
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(site.status)}`}></div>
                  <span className="text-sm font-medium capitalize">{site.status}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="h-4 w-4" />
                    Last Activity:
                  </div>
                  <div className="text-sm text-gray-600 pl-6">{site.lastActivity}</div>
                </div>

                {site.activities.length > 1 && (
                  <div className="space-y-1">
                    {site.activities.slice(1).map((activity, index) => (
                      <div key={index} className="text-xs text-gray-500 pl-6">
                        {activity}
                      </div>
                    ))}
                  </div>
                )}

                {site.type === "BUC" && (
                  <div className="flex justify-center pt-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                        <div className="text-purple-600">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">We are creating something exciting for you!</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No sites found matching your criteria</div>
          <div className="text-gray-400 text-sm mt-2">Try adjusting your search or filter settings</div>
        </div>
      )}
    </div>
  )
}
