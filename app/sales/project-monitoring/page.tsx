"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, X, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getProductsByCompany, type Product } from "@/lib/firebase-service"

export default function ProjectMonitoringPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSite, setSelectedSite] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSiteJOs, setSelectedSiteJOs] = useState<Product[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentSite, setCurrentSite] = useState("")
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

  const formatActivityDate = (date: any) => {
    if (!date) return new Date().toLocaleDateString()
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    })
  }

  const formatActivityTime = (date: any) => {
    if (!date) return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  const generateJobOrderNumber = (index: number) => {
    return `JO: ${(index + 1).toString().padStart(3, "0")}`
  }

  const handleJOClick = (product: Product, index: number) => {
    const site = product.seller_name || product.categories?.[0] || "Unknown Site"
    const siteProducts = products.filter((p) => (p.seller_name || p.categories?.[0] || "Unknown Site") === site)
    setSelectedSiteJOs(siteProducts)
    setCurrentSite(site)
    setDialogOpen(true)
  }

  const getHeaderColor = (index: number) => {
    const colors = [
      "bg-cyan-500", // Cyan like in the reference
      "bg-pink-500", // Pink variant
      "bg-slate-800", // Dark variant
      "bg-blue-500", // Blue variant
      "bg-purple-500", // Purple variant
      "bg-green-500", // Green variant
    ]
    return colors[index % colors.length]
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
                placeholder="Search projects..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-4 bg-gray-200 animate-pulse m-4 mb-2" />
                <div className="h-12 bg-gray-200 animate-pulse mx-4 mb-4 rounded" />
                <CardContent className="p-4 pt-0">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Error loading projects</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">{searchQuery ? "No projects found" : "No projects available"}</p>
            <p className="text-sm text-gray-400">
              {searchQuery ? "Try adjusting your search terms" : "Projects will appear here when added"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-white border border-gray-200"
              >
                <CardContent className="p-0">
                  {/* Job Order Number */}
                  <div className="px-4 pt-3 pb-2">
                    <button
                      onClick={() => handleJOClick(product, index)}
                      className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors"
                    >
                      {generateJobOrderNumber(index)}
                    </button>
                  </div>

                  {/* Project Header */}
                  <div className={`${getHeaderColor(index)} px-4 py-3 mx-4 rounded-md mb-4`}>
                    <h3 className="text-white font-bold text-lg leading-tight">{product.name}</h3>
                  </div>

                  {/* Project Location/Description */}
                  <div className="px-4 pb-2">
                    <p className="text-gray-900 font-medium text-sm">
                      {product.seller_name || product.categories?.[0] || "Project Location"}
                    </p>
                  </div>

                  {/* Last Activity Section */}
                  <div className="px-4 pb-4">
                    <p className="text-gray-700 font-medium text-sm mb-2">Last Activity</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex">
                        <span className="text-gray-500">
                          -{formatActivityDate(product.created_at)}- {formatActivityTime(product.created_at)}-
                        </span>
                        <span className="ml-1">Project initiated</span>
                      </div>
                      {product.updated_at && (
                        <div className="flex">
                          <span className="text-gray-500">
                            -{formatActivityDate(product.updated_at)}- {formatActivityTime(product.updated_at)}-
                          </span>
                          <span className="ml-1">Status updated</span>
                        </div>
                      )}
                      <div className="flex">
                        <span className="text-gray-500">
                          -{formatActivityDate(new Date())}- {formatActivityTime(new Date())}-
                        </span>
                        <span className="ml-1">Ready for monitoring</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog for showing all JOs for a site */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Orders for {currentSite}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedSiteJOs.map((jo, index) => (
              <Card key={jo.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      {generateJobOrderNumber(products.findIndex((p) => p.id === jo.id))}
                    </span>
                    <span className="text-xs text-gray-500">{formatActivityDate(jo.created_at)}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{jo.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{jo.description || "No description available"}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Status: Active</span>
                    {jo.price && <span>₱{jo.price.toLocaleString()}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
