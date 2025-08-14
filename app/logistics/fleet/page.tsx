"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Filter, MapPin, Fuel, Calendar, Settings, Truck, AlertTriangle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { RouteProtection } from "@/components/route-protection"

export default function FleetPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { userData } = useAuth()

  // Mock fleet data
  const fleetVehicles = [
    {
      id: "FL001",
      vehicleNumber: "ABC-1234",
      type: "Service Van",
      driver: "Juan Dela Cruz",
      status: "active",
      location: "Makati City",
      lastMaintenance: "2024-01-15",
      nextMaintenance: "2024-04-15",
      fuelLevel: 85,
      mileage: "45,230 km",
    },
    {
      id: "FL002",
      vehicleNumber: "DEF-5678",
      type: "Installation Truck",
      driver: "Maria Santos",
      status: "maintenance",
      location: "Service Center",
      lastMaintenance: "2024-01-20",
      nextMaintenance: "2024-04-20",
      fuelLevel: 60,
      mileage: "38,450 km",
    },
    {
      id: "FL003",
      vehicleNumber: "GHI-9012",
      type: "Service Van",
      driver: "Pedro Garcia",
      status: "active",
      location: "Quezon City",
      lastMaintenance: "2024-01-10",
      nextMaintenance: "2024-04-10",
      fuelLevel: 92,
      mileage: "52,180 km",
    },
    {
      id: "FL004",
      vehicleNumber: "JKL-3456",
      type: "Cargo Truck",
      driver: "Ana Rodriguez",
      status: "inactive",
      location: "Depot",
      lastMaintenance: "2024-01-25",
      nextMaintenance: "2024-04-25",
      fuelLevel: 45,
      mileage: "29,870 km",
    },
  ]

  const filteredVehicles = fleetVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "maintenance":
        return <AlertTriangle className="h-4 w-4" />
      case "inactive":
        return <Settings className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  return (
    <RouteProtection requiredRoles="logistics">
      <div className="flex-1 overflow-auto relative bg-gray-50">
        <main className="p-6">
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
                <p className="text-gray-600 mt-1">Monitor and manage your vehicle fleet</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Vehicles</p>
                      <p className="text-2xl font-bold text-gray-900">{fleetVehicles.length}</p>
                    </div>
                    <Truck className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-green-600">
                        {fleetVehicles.filter((v) => v.status === "active").length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">In Maintenance</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {fleetVehicles.filter((v) => v.status === "maintenance").length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Inactive</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {fleetVehicles.filter((v) => v.status === "inactive").length}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search vehicles, drivers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-200"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-white border-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="border-gray-200 bg-transparent">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>

            {/* Fleet List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">{vehicle.vehicleNumber}</CardTitle>
                      <Badge className={getStatusColor(vehicle.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(vehicle.status)}
                          <span className="capitalize">{vehicle.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{vehicle.type}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{vehicle.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Driver: {vehicle.driver}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Fuel className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Fuel: {vehicle.fuelLevel}%</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${vehicle.fuelLevel}%` }}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Next Maintenance: {vehicle.nextMaintenance}</span>
                    </div>
                    <div className="text-sm text-gray-600">Mileage: {vehicle.mileage}</div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        View Details
                      </Button>
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Assign Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVehicles.length === 0 && (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </RouteProtection>
  )
}
