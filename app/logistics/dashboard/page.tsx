"use client"

import { useState } from "react"
import { Search, ChevronDown, MapPin, Package, Wrench, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AllSites } from "./all-sites"
import { LEDSitesOverview } from "./led-sites"
import { LEDSitesCompliance } from "./led-sites-compliance"
import { LEDSitesContent } from "./led-sites-content"
import { LEDSitesDisplayHealth } from "./led-sites-display-health"
import { LEDSitesStructure } from "./led-sites-structure"
import { StaticSitesOverview } from "./static-sites"

export default function LogisticsDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDateRange, setSelectedDateRange] = useState("Last 30 Days")

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Logistics Dashboard</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search dashboard..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  {selectedDateRange} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedDateRange("Last 7 Days")}>Last 7 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange("Last 30 Days")}>Last 30 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange("Last 90 Days")}>Last 90 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange("This Year")}>This Year</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">150</div>
              <p className="text-xs text-muted-foreground">+5 new this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Inventory</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120</div>
              <p className="text-xs text-muted-foreground">80% utilization</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">2 critical</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">90% operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Site Types */}
        <Tabs defaultValue="all-sites" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-sites">All Sites</TabsTrigger>
            <TabsTrigger value="led-sites">LED Sites</TabsTrigger>
            <TabsTrigger value="static-sites">Static Sites</TabsTrigger>
          </TabsList>
          <TabsContent value="all-sites">
            <AllSites />
          </TabsContent>
          <TabsContent value="led-sites">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LEDSitesOverview />
              <LEDSitesCompliance />
              <LEDSitesContent />
              <LEDSitesDisplayHealth />
              <LEDSitesStructure />
            </div>
          </TabsContent>
          <TabsContent value="static-sites">
            <StaticSitesOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
