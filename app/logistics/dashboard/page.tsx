"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, MapPin, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { AllSites } from "./all-sites"
import { StaticSites } from "./static-sites"
import { LEDSites } from "./led-sites"
import { LEDSitesContent } from "./led-sites-content"
import { LEDSitesStructure } from "./led-sites-structure"
import { LEDSitesCompliance } from "./led-sites-compliance"

export default function LogisticsDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Logistics Dashboard</h1>
        <p className="text-slate-300">Monitor and manage all site operations</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Issues</p>
                <p className="text-2xl font-bold text-red-600">23</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Operational</p>
                <p className="text-2xl font-bold text-green-600">133</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-yellow-600">47</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sites Tabs */}
      <Tabs defaultValue="all-sites" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all-sites">All Sites</TabsTrigger>
          <TabsTrigger value="static-sites">Static Sites</TabsTrigger>
          <TabsTrigger value="led-sites">LED Sites</TabsTrigger>
          <TabsTrigger value="led-content">LED Content</TabsTrigger>
          <TabsTrigger value="led-structure">LED Structure</TabsTrigger>
          <TabsTrigger value="led-compliance">LED Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="all-sites">
          <AllSites searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="static-sites">
          <StaticSites searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="led-sites">
          <LEDSites searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="led-content">
          <LEDSitesContent searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="led-structure">
          <LEDSitesStructure searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="led-compliance">
          <LEDSitesCompliance searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
