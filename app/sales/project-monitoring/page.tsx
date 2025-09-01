"use client"

import { ArrowLeft, Search, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getProducts, type Product } from "@/lib/firebase-service"

export default function ProjectMonitoringPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSite, setSelectedSite] = useState("select-site")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const fetchedProducts = await getProducts()
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchTerm === "" ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.specs_rental?.location?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getStatusColor = (status?: string) => {
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
        return "bg-cyan-500"
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return "Price not set"
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "No date"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return "Invalid date"
    }
  }

  const bucCards = Array(3).fill({
    title: "BUC",
    message: "We are creating something exciting for you!",
    headerColor: "bg-cyan-500",
    textColor: "text-white",
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Project Bulletins</h1>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              className="pl-10 bg-white border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-48 bg-white border-gray-200">
              <SelectValue placeholder="Select Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select-site">-Select Site-</SelectItem>
              <SelectItem value="site1">Site 1</SelectItem>
              <SelectItem value="site2">Site 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <>
          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.slice(0, 3).map((product) => (
              <Card key={product.id} className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="text-xs text-blue-600 font-medium mb-2">
                    ID: {product.id?.slice(-8).toUpperCase()}
                  </div>
                  <div
                    className={`${getStatusColor(product.status)} text-white px-4 py-2 rounded-md text-center font-bold text-lg`}
                  >
                    {product.name || "Unnamed Product"}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-2">
                    <div className="font-medium text-gray-900">
                      {product.specs_rental?.location || "Location not specified"}
                    </div>
                    <div className="text-sm text-gray-600">Last Activity</div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Created: {formatDate(product.created)}</div>
                      <div className="text-xs text-gray-500">Price: {formatPrice(product.price)}</div>
                      <div className="text-xs text-gray-500">Status: {product.status || "Unknown"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Second Row - BUC Cards */}
            {bucCards.map((card, index) => (
              <Card key={`buc-${index}`} className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-6 text-center">
                  <div
                    className={`${card.headerColor} ${card.textColor} px-4 py-2 rounded-md inline-block font-bold text-lg mb-4`}
                  >
                    {card.title}
                  </div>
                  <div className="flex justify-center mb-4">
                    <div className="flex gap-2">
                      <Building2 className="h-8 w-8 text-purple-500" />
                      <Building2 className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium">{card.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No products found</div>
              <div className="text-gray-400 text-sm">
                {searchTerm ? "Try adjusting your search terms" : "No products available at the moment"}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
