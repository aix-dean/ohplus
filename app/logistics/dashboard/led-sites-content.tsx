"use client"

import { useState, useEffect } from "react"
import { LayoutGrid, List, Play, Square, AlertCircle, Plus, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { Product } from "@/lib/firebase-service"
import { getServiceAssignmentsByProductId, type ServiceAssignment } from "@/lib/firebase-service"

// Number of items to display per page
const ITEMS_PER_PAGE = 8

const contentStatusData = [
  { status: "Published", count: 120 },
  { status: "Scheduled", count: 45 },
  { status: "Draft", count: 30 },
  { status: "Expired", count: 15 },
]

const chartConfig = {
  count: {
    label: "Number of Contents",
    color: "hsl(var(--primary))",
  },
}

export default function LEDSitesContentTab({ products = [] }: { products?: Product[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)

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

      {/* Content Status Chart */}
      <LEDSitesContent />

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
            <Link href={`/logistics/sites/${product.id}?view=content`} key={product.id}>
              <LEDSiteCard product={product} />
            </Link>
          ))}
        </div>
      )}

      {/* Create Service Assignment Button */}
      <div className="fixed bottom-6 right-6">
        <Button size="lg" className="rounded-full shadow-lg gap-2">
          <Plus size={18} />
          Create Service Assignment
        </Button>
      </div>
    </div>
  )
}

// Replace the existing LEDSiteCard component with this updated version
function LEDSiteCard({ product }: { product: Product }) {
  // Get the first media item for the thumbnail
  const thumbnailUrl = product.media && product.media.length > 0 ? product.media[0].url : "/led-billboard-1.png"

  // Determine location based on product type
  const location = product.specs_rental?.location || product.light?.location || "Unknown location"

  // State for service assignments
  const [activeAssignments, setActiveAssignments] = useState<ServiceAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)

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

  const hasActiveAssignments = activeAssignments.length > 0

  // Determine status and health percentage
  const status = product.status === "ACTIVE" ? "Operational" : product.status === "PENDING" ? "Warning" : "Error"
  const statusColor = status === "Operational" ? "green" : status === "Warning" ? "orange" : "red"

  // Generate a health percentage based on status if not available
  const healthPercentage =
    product.health_percentage ||
    (status === "Operational"
      ? Math.floor(Math.random() * 20) + 80
      : // 80-100 for operational
        status === "Warning"
        ? Math.floor(Math.random() * 30) + 50
        : // 50-80 for warning
          Math.floor(Math.random() * 40) + 10) // 10-50 for error

  return (
    <Card className="erp-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-gray-200">
        {/* Service Assignment Badge - only show if there are active assignments */}
        {hasActiveAssignments && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              {activeAssignments.length}
            </div>
          </div>
        )}

        <Image
          src={thumbnailUrl || "/placeholder.svg"}
          alt={product.name || "LED Site"}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/led-billboard-1.png"
            target.className = "object-cover"
          }}
        />
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold">{product.name}</h3>
          <p className="text-xs text-gray-500">ID: {product.id}</p>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`
                  ${statusColor === "green" ? "text-green-600" : ""}
                  ${statusColor === "red" ? "text-red-600" : ""}
                  ${statusColor === "orange" ? "text-orange-600" : ""}
                  font-medium
                `}
              >
                {status}
              </span>
            </div>
            <div>
              {status === "Operational" ? (
                <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center">
                  <Play size={16} fill="currentColor" />
                </div>
              ) : status === "Error" ? (
                <div className="bg-red-100 text-red-600 rounded-full w-8 h-8 flex items-center justify-center">
                  <Square size={16} fill="currentColor" />
                </div>
              ) : (
                <div className="bg-orange-100 text-orange-600 rounded-full w-8 h-8 flex items-center justify-center">
                  <AlertCircle size={16} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-2">
            <Progress
              value={healthPercentage}
              className="h-2"
              indicatorClassName={`
                ${healthPercentage > 80 ? "bg-gradient-to-r from-green-500 to-green-300" : ""}
                ${healthPercentage > 60 && healthPercentage <= 80 ? "bg-gradient-to-r from-yellow-500 to-green-300" : ""}
                ${healthPercentage > 40 && healthPercentage <= 60 ? "bg-gradient-to-r from-orange-500 to-yellow-300" : ""}
                ${healthPercentage <= 40 ? "bg-gradient-to-r from-red-500 to-orange-300" : ""}
              `}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LEDSitesContent() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">LED Sites Content Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={contentStatusData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
