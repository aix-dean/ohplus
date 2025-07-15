"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Calendar, Eye, AlertCircle } from "lucide-react"
import Link from "next/link"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  }>
}

export default function LogisticsBulletinBoard() {
  const { user, userData, loading: authLoading, getEffectiveUserId } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [contentTypeFilter, setContentTypeFilter] = useState("all")

  const fetchProducts = async () => {
    if (!user || !userData) {
      console.log("No user or userData available")
      setProducts([])
      setLoading(false)
      return
    }

    // Ensure we only proceed if this is an OHPLUS account
    if (userData.type !== "OHPLUS") {
      console.log("User is not OHPLUS type, access denied")
      setError("Access denied: Only OHPLUS accounts can access this page")
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      console.log("Fetching products for OHPLUS user:", userData.uid)
      console.log("User company_id:", userData.company_id)
      console.log("User type:", userData.type)

      // Use company_id if available, otherwise fall back to OHPLUS user ID
      const queryCompanyId = userData.company_id || userData.uid
      console.log("Querying products with company_id:", queryCompanyId)

      // Query products collection directly
      const productsQuery = query(
        collection(db, "products"),
        where("company_id", "==", queryCompanyId),
        where("active", "==", true),
        orderBy("created", "desc"),
      )

      const querySnapshot = await getDocs(productsQuery)
      const fetchedProducts: Product[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedProducts.push({
          id: doc.id,
          name: data.name || "Unnamed Site",
          content_type: data.content_type || "Unknown",
          status: data.status || "UNKNOWN",
          company_id: data.company_id || "",
          seller_id: data.seller_id || "",
          active: data.active || false,
          location: data.location || data.specs_rental?.location || "",
          price: data.price || 0,
          created: data.created,
          media: data.media || [],
        })
      })

      console.log("Fetched products from Firestore:", fetchedProducts)
      setProducts(fetchedProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to load sites. Please try again.")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && userData) {
      fetchProducts()
    }
  }, [user, userData, authLoading])

  // Filter products based on search term and content type
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesContentType =
      contentTypeFilter === "all" || product.content_type.toLowerCase() === contentTypeFilter.toLowerCase()
    return matchesSearch && matchesContentType
  })

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-500"
      case "PENDING":
        return "bg-yellow-500"
      case "INACTIVE":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getContentTypeColor = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
      case "led":
      case "dynamic":
        return "bg-blue-500"
      case "static":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || !userData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in with an OHPLUS account to access the bulletin board.</p>
          <Button asChild className="mt-4">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (userData.type !== "OHPLUS") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only OHPLUS accounts can access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Current account type: {userData.type}</p>
          <Button asChild className="mt-4">
            <Link href="/logout">Switch Account</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchProducts}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Logistics Bulletin Board</h1>
        <p className="text-gray-600">Manage and monitor all your sites</p>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Firebase Auth User ID: {user?.uid}</p>
            <p>OHPLUS User ID: {userData.uid}</p>
            <p>Effective User ID: {getEffectiveUserId()}</p>
            <p>User Type: {userData.type}</p>
            <p>Company ID: {userData.company_id || "Not set"}</p>
            <p>Products loaded: {products.length}</p>
            <p>Filtered products: {filteredProducts.length}</p>
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sites by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            <SelectItem value="static">Static Sites</SelectItem>
            <SelectItem value="led">LED Sites</SelectItem>
            <SelectItem value="dynamic">Dynamic Sites</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MapPin className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sites found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || contentTypeFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "You haven't created any sites yet."}
          </p>
          <Button asChild>
            <Link href="/sales/products/new">Create Your First Site</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold truncate">{product.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={`${getContentTypeColor(product.content_type)} text-white`}>
                      {product.content_type}
                    </Badge>
                    <Badge className={`${getStatusColor(product.status)} text-white`}>{product.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{product.location}</span>
                    </div>
                  )}

                  {product.price && (
                    <div className="text-lg font-semibold text-green-600">₱{product.price.toLocaleString()}</div>
                  )}

                  {product.created && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {product.created.toDate ? product.created.toDate().toLocaleDateString() : "Unknown date"}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    <p>Product ID: {product.id}</p>
                    <p>Seller ID: {product.seller_id}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/logistics/bulletin-board/${product.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {filteredProducts.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} sites
        </div>
      )}
    </div>
  )
}
