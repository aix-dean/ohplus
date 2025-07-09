"use client"

import { Progress } from "@/components/ui/progress"

import { Input } from "@/components/ui/input"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, LayoutGrid, List, AlertCircle, Search, Thermometer, Zap, Wifi } from "lucide-react"
import Image from "next/image"
import { CreateReportDialog } from "@/components/create-report-dialog"
import type { Product } from "@/lib/firebase-service"
import { getServiceAssignmentsByProductId, type ServiceAssignment } from "@/lib/firebase-service"

const ledSites: Product[] = [
  {
    id: "led-health-1",
    name: "EDSA Northbound LED",
    media: [{ url: "/led-billboard-1.png" }],
    specs_rental: { location: "Quezon City" },
    light: { type: "LED Billboard" },
    status: "Active",
    lastUpdate: "2 hours ago",
    occupancy: "85%",
    revenue: "₱125,000",
  },
  {
    id: "led-health-2",
    name: "BGC Central Display",
    media: [{ url: "/led-display-1.png" }],
    specs_rental: { location: "Taguig City" },
    light: { type: "LED Display" },
    status: "Active",
    lastUpdate: "30 minutes ago",
    occupancy: "78%",
    revenue: "₱95,000",
  },
  {
    id: "led-health-3",
    name: "Ortigas LED Screen",
    media: [{ url: "/digital-screen-1.png" }],
    specs_rental: { location: "Pasig City" },
    light: { type: "Digital Screen" },
    status: "Warning",
    lastUpdate: "4 hours ago",
    occupancy: "65%",
    revenue: "₱75,000",
  },
]

export default function LEDSitesDisplayHealthTab({ products = ledSites }: { products?: Product[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string>("")

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter products based on search term
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredProducts(products)
      return
    }

    const filtered = products.filter(
      (product) =>
        product.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.id?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
    )
    setFilteredProducts(filtered)
  }, [debouncedSearchTerm, products])

  return (
    <div className="flex flex-col gap-4">
      {/* Date, Search and View Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-sm text-gray-600">
          {currentDate}, {currentTime}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search LED sites..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="border rounded-md p-1 flex">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={18} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No LED sites found</h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearchTerm
              ? `No LED sites matching "${debouncedSearchTerm}" were found`
              : "No dynamic content LED sites are currently available"}
          </p>
        </div>
      )}

      {/* LED Site Grid */}
      {filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {filteredProducts.map((product) => (
            <DisplayHealthCard
              key={product.id}
              product={product}
              onCreateReport={(siteId) => {
                setSelectedSiteId(siteId)
                setReportDialogOpen(true)
              }}
            />
          ))}
        </div>
      )}

      {/* Report Dialog */}
      <CreateReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} siteId={selectedSiteId} />
    </div>
  )
}

function DisplayHealthCard({
  product,
  onCreateReport,
}: { product: Product; onCreateReport: (siteId: string) => void }) {
  // Get the first media item for the thumbnail
  const thumbnailUrl = product.media && product.media.length > 0 ? product.media[0].url : "/led-billboard-1.png"

  // Determine location based on product type
  const location = product.specs_rental?.location || product.light?.location || "Unknown location"

  // State for service assignments
  const [activeAssignments, setActiveAssignments] = useState<ServiceAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)

  // Add the handleCreateReport function
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCreateReport(product.id)
  }

  const handleCardClick = () => {
    window.location.href = `/logistics/sites/${product.id}?view=display-health`
  }

  // Fetch service assignments for this specific product
  useEffect(() => {
    const fetchProductAssignments = async () => {
      try {
        setIsLoadingAssignments(true)
        const assignments = await getServiceAssignmentsByProductId(product.id)
        setActiveAssignments(assignments)
      } catch (error) {
        console.error(`Error fetching assignments for product ${product.id}:`, error)
      } finally {
        setIsLoadingAssignments(false)
      }
    }

    fetchProductAssignments()
  }, [product.id])

  // Generate mock health data
  const healthData = {
    overall: Math.floor(Math.random() * 30) + 70, // 70-100%
    temperature: Math.floor(Math.random() * 20) + 35, // 35-55°C
    brightness: Math.floor(Math.random() * 30) + 70, // 70-100%
    connectivity: Math.random() > 0.2 ? "Connected" : "Disconnected",
  }

  const getHealthColor = (value: number) => {
    if (value >= 80) return "text-green-600"
    if (value >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getHealthBgColor = (value: number) => {
    if (value >= 80) return "bg-green-100"
    if (value >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  return (
    <Card
      className="erp-card overflow-hidden cursor-pointer border border-gray-200 shadow-md rounded-xl transition-all hover:shadow-lg bg-white"
      onClick={handleCardClick}
    >
      <div className="relative h-48 bg-gray-200">
        <Image
          src={thumbnailUrl || "/placeholder.svg"}
          alt={product.name || "LED Site"}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/led-billboard-1.png"
            target.className = "opacity-50 object-contain"
          }}
        />

        {/* Notification badge */}
        {activeAssignments.length > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
            {activeAssignments.length}
          </div>
        )}

        {/* Health status overlay */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="outline"
            className={`${getHealthBgColor(healthData.overall)} ${getHealthColor(healthData.overall)} border-current`}
          >
            {healthData.overall}% Health
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg">{product.name || "Unnamed Site"}</h3>
          <div className="text-xs text-gray-500">ID: {product.id}</div>
          <div className="text-sm text-gray-500">{location}</div>

          {/* Health metrics */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-orange-500" />
              <div>
                <div className="text-xs text-gray-500">Temperature</div>
                <div className="text-sm font-medium">{healthData.temperature}°C</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-500" />
              <div>
                <div className="text-xs text-gray-500">Brightness</div>
                <div className="text-sm font-medium">{healthData.brightness}%</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wifi size={16} className={healthData.connectivity === "Connected" ? "text-green-500" : "text-red-500"} />
              <div>
                <div className="text-xs text-gray-500">Connection</div>
                <div className="text-sm font-medium">{healthData.connectivity}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              <div>
                <div className="text-xs text-gray-500">Uptime</div>
                <div className="text-sm font-medium">99.2%</div>
              </div>
            </div>
          </div>

          {/* Overall health progress */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Overall Health</span>
              <span className={`text-sm font-medium ${getHealthColor(healthData.overall)}`}>{healthData.overall}%</span>
            </div>
            <Progress
              value={healthData.overall}
              className="h-2"
              indicatorClassName={
                healthData.overall >= 80 ? "bg-green-500" : healthData.overall >= 60 ? "bg-yellow-500" : "bg-red-500"
              }
            />
          </div>

          {/* Add Create Report Button */}
          <Button
            variant="outline"
            className="mt-4 w-full rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
            onClick={handleCreateReport}
          >
            Create Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
