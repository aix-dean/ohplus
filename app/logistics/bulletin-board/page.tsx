"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, MapPin, Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { CreateReportDialog } from "@/components/create-report-dialog"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Product {
  id: string
  name: string
  content_type: string
  status: string
  company_id: string
  seller_id: string
  active: boolean
  location?: string
  price?: number
  created?: any
  media?: Array<{
    url: string
    type: string
    isVideo: boolean
    distance?: string
  }>
  light?: {
    location?: string
    size?: string
  }
  specs_rental?: {
    location?: string
    size?: string
    material?: string
  }
  site_code?: string
}

export default function BulletinBoardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContentType, setSelectedContentType] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [createReportOpen, setCreateReportOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState("")

  const { user, userData, loading: authLoading, getEffectiveUserId, getEffectiveCompanyId } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && userData) {
      fetchProducts()
    }
  }, [authLoading, userData])

  const fetchProducts = async () => {
    if (!userData || userData.type !== "OHPLUS") {
      console.log("Access denied: User is not OHPLUS type")
      toast({
        title: "Access Denied",
        description: "Only OHPLUS users can access this page",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const effectiveUserId = getEffectiveUserId()
      const effectiveCompanyId = getEffectiveCompanyId()

      console.log("Fetching products for OHPLUS user:", effectiveUserId)
      console.log("User company_id:", effectiveCompanyId)
      console.log("User type:", userData.type)

      // Query products using the effective company ID
      const queryCompanyId = effectiveCompanyId || effectiveUserId
      console.log("Querying products with company_id:", queryCompanyId)

      const productsQuery = query(
        collection(db, "products"),
        where("company_id", "==", queryCompanyId),
        where("active", "==", true),
        orderBy("created", "desc"),
      )

      const querySnapshot = await getDocs(productsQuery)
      const fetchedProducts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]

      console.log("Fetched products from Firestore:", fetchedProducts)
      setProducts(fetchedProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load sites. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.location && product.location.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesContentType =
      selectedContentType === "all" || product.content_type?.toLowerCase() === selectedContentType.toLowerCase()

    return matchesSearch && matchesContentType
  })

  const handleCreateReport = (siteId: string) => {
    setSelectedSiteId(siteId)
    setCreateReportOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "inactive":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getContentTypeColor = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
      case "dynamic":
        return "bg-blue-500 text-white"
      case "static":
        return "bg-purple-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!userData || userData.type !== "OHPLUS") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only OHPLUS users can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulletin Board</h1>
              <p className="text-sm text-gray-600">Manage your advertising sites and create service reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Information:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-yellow-700">
              <div>
                <div>
                  <strong>Firebase Auth UID:</strong> {user?.firebaseAuthUid || "N/A"}
                </div>
                <div>
                  <strong>Effective User ID:</strong> {getEffectiveUserId()}
                </div>
                <div>
                  <strong>User Type:</strong> {userData?.type}
                </div>
              </div>
              <div>
                <div>
                  <strong>User Company ID:</strong> {userData?.company_id || "N/A"}
                </div>
                <div>
                  <strong>Effective Company ID:</strong> {getEffectiveCompanyId()}
                </div>
                <div>
                  <strong>Products Count:</strong> {products.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search sites by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dynamic">Dynamic</SelectItem>
                  <SelectItem value="static">Static</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Loading sites...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {products.length === 0 ? "No sites found" : "No sites match your search criteria"}
            </div>
            {products.length === 0 && (
              <p className="text-sm text-gray-400">Sites will appear here once they are added to your account</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Site Image */}
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                    {product.media && product.media.length > 0 ? (
                      <img
                        src={product.media[0].url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  {/* Site Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                      {(product.light?.location || product.specs_rental?.location) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {product.light?.location || product.specs_rental?.location}
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getContentTypeColor(product.content_type)}>
                        {product.content_type || "Unknown"}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(product.status)}`} />
                        {product.status || "Unknown"}
                      </Badge>
                      {product.site_code && <Badge variant="secondary">{product.site_code}</Badge>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/logistics/sites/${product.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleCreateReport(product.id)}
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Report Dialog */}
      <CreateReportDialog open={createReportOpen} onOpenChange={setCreateReportOpen} siteId={selectedSiteId} />
    </div>
  )
}
