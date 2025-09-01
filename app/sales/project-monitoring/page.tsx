"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, X, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getProductsByCompany, type Product } from "@/lib/firebase-service"

export default function ProjectMonitoringPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSite, setSelectedSite] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { userData } = useAuth()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        if (!userData?.company_id) {
          setError("No company associated with your account")
          setProducts([])
          return
        }
        const fetchedProducts = await getProductsByCompany(userData.company_id)
        setProducts(fetchedProducts)
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Failed to load products")
      } finally {
        setLoading(false)
      }
    }

    if (userData !== null) {
      fetchProducts()
    }
  }, [userData])

  const filteredProducts = products.filter(
    (product) =>
      (product.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  )

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  const handleBack = () => {
    router.back()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="p-1 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Project Bulletins</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 hover:bg-gray-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-48 bg-gray-50 border-gray-200">
                <SelectValue placeholder="-Select Site-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site1">Site 1</SelectItem>
                <SelectItem value="site2">Site 2</SelectItem>
                <SelectItem value="site3">Site 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Error loading products</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">{searchQuery ? "No products found" : "No products available"}</p>
            <p className="text-sm text-gray-400">
              {searchQuery ? "Try adjusting your search terms" : "Products will appear here when added"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              >
                <div className="aspect-square relative bg-gray-100">
                  {(() => {
                    const imageUrl =
                      product.imageUrl && product.imageUrl.trim() !== ""
                        ? product.imageUrl
                        : product.media &&
                            product.media.length > 0 &&
                            product.media[0]?.url &&
                            product.media[0].url.trim() !== ""
                          ? product.media[0].url
                          : null

                    return imageUrl ? (
                      <img
                        src={imageUrl || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          target.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null
                  })()}
                  <div
                    className={`absolute inset-0 flex items-center justify-center ${
                      (product.imageUrl && product.imageUrl.trim() !== "") ||
                      (
                        product.media &&
                          product.media.length > 0 &&
                          product.media[0]?.url &&
                          product.media[0].url.trim() !== ""
                      )
                        ? "hidden"
                        : ""
                    }`}
                  >
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  {product.active && (
                    <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">Active</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</span>
                    {product.categories && product.categories.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {product.categories[0]}
                      </Badge>
                    )}
                  </div>
                  {product.seller_name && <p className="text-xs text-gray-500 mt-2">by {product.seller_name}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
