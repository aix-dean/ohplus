"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, MapPin, Activity, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAllProducts, type Product } from "@/lib/firebase-service"

export default function BulletinBoardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSite, setSelectedSite] = useState("all")
  const [sites, setSites] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true)
        const products = await getAllProducts()
        setSites(products)
      } catch (error) {
        console.error("Error fetching sites:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSites()
  }, [])

  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.specs_rental?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const siteType = site.content_type?.toLowerCase() || "other"
    const matchesSite =
      selectedSite === "all" ||
      (selectedSite === "led" && siteType === "led") ||
      (selectedSite === "static" && siteType === "static") ||
      (selectedSite === "other" && !["led", "static"].includes(siteType))

    return matchesSearch && matchesSite && !site.deleted
  })

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "approved":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "inactive":
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCardHeaderColor = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
      case "led":
        return "bg-cyan-500"
      case "static":
        return "bg-pink-500"
      default:
        return "bg-gray-800"
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "No date available"

    try {
      let date: Date
      if (timestamp.toDate) {
        // Firestore Timestamp
        date = timestamp.toDate()
      } else if (timestamp instanceof Date) {
        date = timestamp
      } else {
        date = new Date(timestamp)
      }

      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      return "Invalid date"
    }
  }

  const getLastActivity = (site: Product) => {
    if (site.updated) {
      return `Updated: ${formatDate(site.updated)}`
    } else if (site.created) {
      return `Created: ${formatDate(site.created)}`
    }
    return "No recent activity"
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/logistics/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Project Bulletins
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading sites...</span>
        </div>
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
            <SelectItem value="led">LED Sites</SelectItem>
            <SelectItem value="static">Static Sites</SelectItem>
            <SelectItem value="other">Other Sites</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSites.map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className={`${getCardHeaderColor(site.content_type || "")} text-white p-4`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">{site.name || "Unnamed Site"}</CardTitle>
                {site.content_type && (
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {site.content_type.toUpperCase()}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <MapPin className="h-4 w-4" />
                {site.specs_rental?.location || "Location not specified"}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Site ID:</span> {site.id}
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(site.status || "")}`}></div>
                  <span className="text-sm font-medium capitalize">{site.status || "Unknown"}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="h-4 w-4" />
                    Last Activity:
                  </div>
                  <div className="text-sm text-gray-600 pl-6">{getLastActivity(site)}</div>
                </div>

                {site.description && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span>
                    <div className="mt-1 line-clamp-2">{site.description}</div>
                  </div>
                )}

                {site.price && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Price:</span> ₱{site.price.toLocaleString()}
                  </div>
                )}

                {site.specs_rental?.traffic_count && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Traffic Count:</span>{" "}
                    {site.specs_rental.traffic_count.toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSites.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No sites found matching your criteria</div>
          <div className="text-gray-400 text-sm mt-2">Try adjusting your search or filter settings</div>
        </div>
      )}
    </div>
  )
}
