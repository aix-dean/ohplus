"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MapPin, Eye, Edit, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { CompanyRegistrationDialog } from "@/components/company-registration-dialog"

// Mock data for demonstration
const mockSites = [
  {
    id: "1",
    name: "EDSA Billboard - Ortigas",
    type: "LED Billboard",
    location: "EDSA, Ortigas Center, Pasig City",
    status: "active",
    dimensions: "12m x 6m",
    price: "₱150,000/month",
    availability: "Available",
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    name: "Ayala Avenue Digital Display",
    type: "Digital Display",
    location: "Ayala Avenue, Makati City",
    status: "occupied",
    dimensions: "8m x 4m",
    price: "₱80,000/month",
    availability: "Occupied until March 2024",
    lastUpdated: "2024-01-10",
  },
  {
    id: "3",
    name: "BGC Transit Billboard",
    type: "Static Billboard",
    location: "Bonifacio Global City, Taguig",
    status: "maintenance",
    dimensions: "10m x 5m",
    price: "₱120,000/month",
    availability: "Under Maintenance",
    lastUpdated: "2024-01-12",
  },
]

export default function InventoryPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [sites, setSites] = useState(mockSites)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)

  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || site.status === statusFilter
    const matchesType = typeFilter === "all" || site.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAddSite = () => {
    // Check if user has company_id
    if (!userData?.company_id) {
      setShowCompanyDialog(true)
      return
    }

    // Check subscription status and redirect accordingly
    if (userData.subscription_status === "active") {
      router.push("/admin/products/create")
    } else {
      router.push("/admin/subscriptions/choose-plan")
    }
  }

  const handleCompanyRegistrationSuccess = () => {
    setShowCompanyDialog(false)
    // After company registration, check subscription and redirect
    if (userData?.subscription_status === "active") {
      router.push("/admin/products/create")
    } else {
      router.push("/admin/subscriptions/choose-plan")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Site Inventory</h1>
          <p className="text-gray-600 mt-2">Manage your outdoor advertising sites</p>
        </div>
        <Button onClick={handleAddSite} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Site
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sites by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="LED Billboard">LED Billboard</SelectItem>
                <SelectItem value="Digital Display">Digital Display</SelectItem>
                <SelectItem value="Static Billboard">Static Billboard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSites.map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{site.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {site.location}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(site.status)}>
                  {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{site.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="font-medium">{site.dimensions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-green-600">{site.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Availability:</span>
                  <span className="font-medium">{site.availability}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="text-gray-500">{site.lastUpdated}</span>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <MapPin className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sites found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first advertising site"}
            </p>
            {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
              <Button onClick={handleAddSite}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Site
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Company Registration Dialog */}
      <CompanyRegistrationDialog
        isOpen={showCompanyDialog}
        onClose={() => setShowCompanyDialog(false)}
        onSuccess={handleCompanyRegistrationSuccess}
      />
    </div>
  )
}
