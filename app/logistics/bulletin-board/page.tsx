"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getPaginatedUserProducts, type Product } from "@/lib/firebase-service"
import { getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
      // Get user's company_id first
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data()
      const companyId = userData?.company_id || user.uid // fallback to user.uid if no company_id

      console.log("Fetching products for company_id:", companyId)

      const result = await getPaginatedUserProducts(companyId, 1000, null, {
        active: true,
        searchTerm: debouncedSearchTerm,
      })

      console.log("Fetched products:", result.items)

      // Show all active products for logistics bulletin board
      const filteredItems = result.items.filter((product) => product.active !== false)
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
    if (selectedSite === "led") return product.content_type?.toLowerCase() === "led"
    return false
  })

  const getCardHeaderColor = (name: string) => {
    // Generate a consistent color based on the name
    if (name?.toLowerCase().includes("lilo")) return "bg-cyan-500"
    if (name?.toLowerCase().includes("fairy")) return "bg-pink-500"
    if (name?.toLowerCase().includes("funalo")) return "bg-gray-800"

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

  // Generate mock activity data for each site
  const generateMockActivities = (productId: string) => {
    return [
      "5/6/25: 5:00PM - Arrival of FA to site",
      "5/6/25: 3:00PM - Reported Bad Weather as cause",
      "5/3/25: 1:30PM - Contacted Team C for installation",
    ]
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
            <SelectItem value="led">LED Sites</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Debug Info - Remove this after testing */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-4 p-4 bg-gray-100 rounded-md text-sm">
          <p>Total products loaded: {products.length}</p>
          <p>Filtered sites: {filteredSites.length}</p>
          <p>User ID: {user?.uid}</p>
          {products.length > 0 && (
            <div>
              <p>Sample product content_types:</p>
              {products.slice(0, 3).map((p) => (
                <div key={p.id}>
                  {p.id}: {p.content_type} (company_id: {p.company_id})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading sites...</p>
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
            const activities = generateMockActivities(product.id)

            return (
              <Link key={product.id} href={`/logistics/bulletin-board/${product.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 rounded-lg">
                  <CardContent className="p-0">
                    {/* Site ID at top */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="text-xs text-blue-600 font-medium">{product.id}</div>
                    </div>

                    {/* Site Name Header */}
                    <div className={`${getCardHeaderColor(product.name)} text-white px-4 py-3 mx-3 rounded-md mb-3`}>
                      <div className="font-bold text-lg">{product.name}</div>
                      <div className="text-xs opacity-90">
                        {product.content_type} • {product.status || "Active"}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="px-4 pb-2">
                      <div className="font-medium text-gray-900">
                        {product.specs_rental?.location || product.light?.location || "Unknown location"}
                      </div>
                    </div>

                    {/* Last Activity */}
                    <div className="px-4 pb-4">
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Last Activity:</span>
                      </div>
                      <div className="space-y-1">
                        {activities.map((activity, index) => (
                          <div key={index} className="text-xs text-gray-500">
                            {activity}
                          </div>
                        ))}
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
          <h3 className="text-lg font-medium mb-2">No sites found</h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearchTerm
              ? "No sites match your search criteria. Try adjusting your search terms."
              : "You don't have any sites yet. Contact an administrator to add sites."}
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
