"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getAllProducts } from "@/lib/firebase-service"
import { Search, Filter, Plus, Eye, Edit, MoreHorizontal, Calendar, Users, TrendingUp, Activity } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  status: string
  type: string
  imageUrl?: string
  created?: any
  updated?: any
  company_id?: string
  seller_id?: string
  specs_rental?: {
    location?: string
    traffic_count?: number
    height?: number
    width?: number
  }
  cms?: {
    start_time?: string
    end_time?: string
    loops_per_day?: number
    spot_duration?: number
  }
}

export default function CMSDashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("CMS Dashboard: Fetching products...")
        const allProducts = await getAllProducts()
        console.log("CMS Dashboard: Products fetched:", allProducts.length)
        setProducts(allProducts)
      } catch (error) {
        console.error("CMS Dashboard: Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchProducts()
    }
  }, [user])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedTab === "all") return matchesSearch
    if (selectedTab === "active") return matchesSearch && product.status === "ACTIVE"
    if (selectedTab === "pending") return matchesSearch && product.status === "PENDING"
    if (selectedTab === "inactive") return matchesSearch && product.status === "INACTIVE"

    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "INACTIVE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown"
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString()
    }
    return new Date(timestamp).toLocaleDateString()
  }

  const formatLocation = (location: string) => {
    return location && location.length > 30 ? location.substring(0, 30) + "..." : location || "Not specified"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">CMS Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const activeProducts = products.filter((p) => p.status === "ACTIVE").length
  const pendingProducts = products.filter((p) => p.status === "PENDING").length
  const totalRevenue = products.length * 15000 // Mock calculation
  const totalViews = products.reduce((sum, p) => sum + (p.specs_rental?.traffic_count || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CMS Dashboard</h1>
          <p className="text-gray-600">Manage your digital signage content and campaigns</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" />
          Add Content
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Displays</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Setup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProducts}</div>
            <p className="text-xs text-muted-foreground">Awaiting configuration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Daily average traffic</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search displays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter size={16} className="mr-2" />
          Filter
        </Button>
      </div>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Displays ({products.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeProducts})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingProducts})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Traffic Count</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatLocation(product.specs_rental?.location || "")}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.type}</Badge>
                        </TableCell>
                        <TableCell>{product.specs_rental?.traffic_count?.toLocaleString() || "N/A"}</TableCell>
                        <TableCell>{formatDate(product.created)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/cms/details/${product.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye size={16} />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Edit size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm ? "No displays found matching your search." : "No displays found."}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
