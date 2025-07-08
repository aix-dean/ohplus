"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Calendar, DollarSign, Eye, Edit, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { CompanyRegistrationDialog } from "@/components/company-registration-dialog"
import { toast } from "@/components/ui/use-toast"

// Mock data for demonstration
const mockInventoryData = [
  {
    id: "1",
    name: "EDSA Billboard - Ortigas",
    location: "EDSA, Ortigas Center, Pasig City",
    type: "LED Billboard",
    size: "6m x 3m",
    status: "Available",
    price: "₱50,000/month",
    dateAdded: "2024-01-15",
    image: "/led-billboard-1.png",
  },
  {
    id: "2",
    name: "Ayala Avenue Digital Display",
    location: "Ayala Avenue, Makati City",
    type: "Digital Display",
    size: "4m x 2m",
    status: "Occupied",
    price: "₱35,000/month",
    dateAdded: "2024-01-10",
    image: "/led-billboard-2.png",
  },
  {
    id: "3",
    name: "BGC Static Billboard",
    location: "Bonifacio Global City, Taguig",
    type: "Static Billboard",
    size: "8m x 4m",
    status: "Available",
    price: "₱25,000/month",
    dateAdded: "2024-01-08",
    image: "/roadside-billboard.png",
  },
]

export default function InventoryPage() {
  const router = useRouter()
  const { userData, subscriptionData, loading } = useAuth()
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)
  const [inventoryData, setInventoryData] = useState(mockInventoryData)

  const handleAddSite = () => {
    // Check if user has company_id
    if (!userData?.company_id) {
      setShowCompanyDialog(true)
      return
    }

    // Check subscription status
    if (!subscriptionData || subscriptionData.status !== "active") {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to add new sites. Please upgrade your plan.",
        variant: "destructive",
      })
      router.push("/admin/subscriptions")
      return
    }

    // Proceed to add site
    router.push("/admin/products/create")
  }

  const handleCompanyRegistrationSuccess = () => {
    setShowCompanyDialog(false)
    toast({
      title: "Company Registered",
      description: "Your company has been registered successfully. You can now add sites.",
    })
    // After company registration, proceed with subscription check
    handleAddSite()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your outdoor advertising sites and availability</p>
        </div>
        <Button onClick={handleAddSite} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryData.filter((item) => item.status === "Available").length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for booking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryData.filter((item) => item.status === "Occupied").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently generating revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱85,000</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventoryData.map((site) => (
          <Card key={site.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative bg-gray-200">
              <img src={site.image || "/placeholder.svg"} alt={site.name} className="w-full h-full object-cover" />
              <Badge className={`absolute top-2 right-2 ${getStatusColor(site.status)}`}>{site.status}</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{site.name}</CardTitle>
              <CardDescription className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                {site.location}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{site.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{site.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-green-600">{site.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Added:</span>
                  <span className="font-medium">{new Date(site.dateAdded).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/inventory/${site.id}`)}>
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/inventory/edit/${site.id}`)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inventoryData.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sites added</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first advertising site.</p>
          <div className="mt-6">
            <Button onClick={handleAddSite} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </div>
        </div>
      )}

      <CompanyRegistrationDialog
        isOpen={showCompanyDialog}
        onClose={() => setShowCompanyDialog(false)}
        onSuccess={handleCompanyRegistrationSuccess}
      />
    </div>
  )
}
