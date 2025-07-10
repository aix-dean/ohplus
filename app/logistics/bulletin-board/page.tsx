"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, MapPin, Activity, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getPaginatedUserProducts, type Product } from "@/lib/firebase-service"
import Image from "next/image"

export default function BulletinBoardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedSite, setSelectedSite] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const result = await getPaginatedUserProducts(user.uid, 1000, null, {
        active: true,
        searchTerm: debouncedSearchTerm,
      })

      // Filter products to only show static content type
      const filteredItems = result.items.filter((product) => product.content_type?.toLowerCase() === "static")
      setProducts(filteredItems)
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to load sites. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [user?.uid, debouncedSearchTerm])

  // Load data when user or search term changes
  useEffect(() => {
    if (user?.uid) {
      fetchProducts()
    }
  }, [user?.uid, fetchProducts])

  // Filter sites based on selected filter
  const filteredSites = products.filter((product) => {
    if (selectedSite === "all") return true
    if (selectedSite === "static") return product.content_type?.toLowerCase() === "static"
    return false
  })

  // Convert product to site format for display
  const productToSite = (product: Product) => {
    // Determine status color based on product status
    let statusColor = "bg-blue-500"
    if (product.status === "ACTIVE" || product.status === "OCCUPIED") statusColor = "bg-green-500"
    if (product.status === "VACANT" || product.status === "AVAILABLE") statusColor = "bg-green-500"
    if (product.status === "MAINTENANCE" || product.status === "REPAIR") statusColor = "bg-red-500"
    if (product.status === "PENDING" || product.status === "INSTALLATION") statusColor = "bg-orange-500"

    // Get image from product media or use placeholder
    const image = product.media && product.media.length > 0 ? product.media[0].url : "/roadside-billboard.png"

    return {
      id: product.id,
      name: product.name,
      location: product.specs_rental?.location || product.light?.location || "Unknown location",
      status: product.status || "Unknown",
      statusColor,
      image,
      lastActivity: `Last updated: ${product.updated_at ? new Date(product.updated_at.seconds * 1000).toLocaleDateString() : "Unknown"}`,
      activities: [
        `Status: ${product.status || "Unknown"}`,
        `Type: ${product.content_type || "Unknown"}`,
        `Created: ${product.created_at ? new Date(product.created_at.seconds * 1000).toLocaleDateString() : "Unknown"}`,
      ],
      type: "Static",
    }
  }

  const getCardHeaderColor = (name: string) => {
    // Generate a consistent color based on the name
    const colors = [
      "bg-cyan-500",
      "bg-pink-500",
      "bg-purple-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-indigo-500",
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Show loading if no user
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading user data...</p>
      </div>
    )
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
            <SelectItem value="static">Static Sites</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading static sites...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <Button variant="outline" className="mt-4 bg-transparent" onClick={fetchProducts}>
            Try Again
          </Button>
        </div>
      )}

      {/* Sites Grid */}
      {!loading && !error && filteredSites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((product) => {
            const site = productToSite(product)

            return (
              <Link key={site.id} href={`/logistics/bulletin-board/${site.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className={`${getCardHeaderColor(site.name)} text-white p-4`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">{site.name}</CardTitle>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        S
                      </Badge>
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
                        <div className={`w-2 h-2 rounded-full ${site.statusColor}`}></div>
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

                      {/* Site Image */}
                      <div className="relative h-24 bg-gray-200 rounded-md overflow-hidden">
                        <Image
                          src={site.image || "/placeholder.svg"}
                          alt={site.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/roadside-billboard.png"
                            target.className = "opacity-50 object-contain"
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredSites.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No static sites found</h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearchTerm
              ? "No static sites match your search criteria. Try adjusting your search terms."
              : "You don't have any static sites yet. Contact an administrator to add static sites."}
          </p>
          {debouncedSearchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
