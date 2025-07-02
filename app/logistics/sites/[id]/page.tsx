"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  ImageIcon,
  Wrench,
  Cloud,
  Trash2,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ResponsiveTable } from "@/components/responsive-table"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { useToast } from "@/hooks/use-toast"
import { CompactWeatherForecast } from "@/components/compact-weather-forecast"

interface SiteItem {
  id: string
  name: string
  type: string
  status: string
  location: string
  coordinates: { lat: number; lon: number }
  lastMaintenance: string
  nextMaintenance: string
  installationDate: string
  cost: number
  imageUrl: string
  description: string
  specifications: { label: string; value: string }[]
  maintenanceHistory: { date: string; description: string; cost: number }[]
  campaigns: { id: string; name: string; startDate: string; endDate: string }[]
}

const mockSiteItem: SiteItem = {
  id: "1",
  name: "LED Billboard - EDSA",
  type: "LED Billboard",
  status: "Active",
  location: "EDSA, Mandaluyong City",
  coordinates: { lat: 14.5894, lon: 121.0359 }, // Example coordinates for EDSA
  lastMaintenance: "2024-05-10",
  nextMaintenance: "2025-05-10",
  installationDate: "2022-01-15",
  cost: 150000,
  imageUrl: "/led-billboard-1.png",
  description:
    "High-resolution LED billboard located in a prime commercial area along EDSA. Ideal for large-scale advertising campaigns.",
  specifications: [
    { label: "Dimensions", value: "10m x 5m" },
    { label: "Resolution", value: "1920 x 1080" },
    { label: "Brightness", value: "6000 nits" },
    { label: "Power Consumption", value: "15 kW" },
  ],
  maintenanceHistory: [
    { date: "2024-05-10", description: "Routine check-up and cleaning", cost: 500 },
    { date: "2023-11-15", description: "LED module replacement (section A)", cost: 2500 },
    { date: "2023-05-20", description: "Power supply unit inspection", cost: 300 },
  ],
  campaigns: [
    { id: "camp1", name: "Summer Sale 2024", startDate: "2024-06-01", endDate: "2024-08-31" },
    { id: "camp2", name: "Brand Awareness Drive", startDate: "2024-03-01", endDate: "2024-05-31" },
  ],
}

export default function SiteDetailsPage() {
  const params = useParams()
  const { id } = params
  const { toast } = useToast()
  const [siteItem, setSiteItem] = useState<SiteItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    // In a real application, you would fetch data based on `id`
    // For now, we use mock data
    if (id === "1") {
      setSiteItem(mockSiteItem)
    } else {
      setSiteItem(null) // Or handle not found
    }
  }, [id])

  const handleDelete = () => {
    // In a real application, send a delete request to your API
    console.log(`Deleting site item with ID: ${id}`)
    toast({
      title: "Site Deleted",
      description: `Site "${siteItem?.name}" has been successfully deleted.`,
      variant: "destructive",
    })
    setIsDeleteDialogOpen(false)
    // Redirect to site list or show a success message
    // router.push("/logistics/dashboard");
  }

  if (!siteItem) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <p>Loading site item or item not found...</p>
      </div>
    )
  }

  const maintenanceColumns = [
    { header: "Date", accessorKey: "date" },
    { header: "Description", accessorKey: "description" },
    { header: "Cost", accessorKey: "cost", cell: (info: any) => `$${info.getValue().toFixed(2)}` },
  ]

  const campaignsColumns = [
    {
      header: "Campaign Name",
      accessorKey: "name",
      cell: (info: any) => (
        <Link href={`/sales/project-campaigns/${info.row.original.id}`} className="text-blue-600 hover:underline">
          {info.getValue()}
        </Link>
      ),
    },
    { header: "Start Date", accessorKey: "startDate" },
    { header: "End Date", accessorKey: "endDate" },
  ]

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" asChild>
              <Link href="/logistics/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to logistics dashboard</span>
              </Link>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              {siteItem.name}
            </h1>
            <Badge variant="outline" className="ml-auto sm:ml-0">
              {siteItem.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/logistics/sites/edit/${siteItem.id}`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Site Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Site Details</CardTitle>
              <CardDescription>Comprehensive information about the site.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Type</span>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" /> {siteItem.type}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Location</span>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {siteItem.location}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Installation Date</span>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {siteItem.installationDate}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Last Maintenance</span>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> {siteItem.lastMaintenance}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Next Maintenance</span>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {siteItem.nextMaintenance}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Cost</span>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> ${siteItem.cost.toLocaleString()}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Description</span>
                <p className="text-muted-foreground">{siteItem.description}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Specifications</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {siteItem.specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between text-muted-foreground">
                      <span>{spec.label}:</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Image and Weather Card */}
          <Card>
            <CardHeader>
              <CardTitle>Visual & Environment</CardTitle>
              <CardDescription>Image and local weather forecast.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {siteItem.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={siteItem.imageUrl || "/placeholder.svg"}
                  alt={siteItem.name}
                  className="max-w-full max-h-64 object-contain rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 w-full bg-muted rounded-md text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <span>No Image Available</span>
                </div>
              )}
              <Separator />
              <div className="grid gap-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Cloud className="h-4 w-4" /> Local Weather Forecast
                </span>
                <CompactWeatherForecast lat={siteItem.coordinates.lat} lon={siteItem.coordinates.lon} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance History */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
            <CardDescription>Records of past maintenance activities for this site.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={siteItem.maintenanceHistory} columns={maintenanceColumns} />
          </CardContent>
        </Card>

        {/* Associated Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Associated Campaigns</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Link Campaign
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveTable data={siteItem.campaigns} columns={campaignsColumns} />
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete "${siteItem.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
