"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, PlusCircle, CalendarIcon, Search, Filter, X } from "lucide-react"
import type { DateRange } from "react-day-picker"
import {
  createQuotation,
  generateQuotationNumber,
  calculateItemTotal, // Use calculateItemTotal for each item
  calculateQuotationTotal, // Use calculateQuotationTotal for overall sum
  type QuotationItem,
} from "@/lib/quotation-service"
import { useToast } from "@/hooks/use-toast"
import { getProductsBySellerId, type Product } from "@/lib/firebase-service"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react" // Import Loader2

export default function SalesDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([])
  const [selectedSites, setSelectedSites] = useState<Product[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false)

  const [quotations, setQuotations] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot<DocumentData>[]>([])

  const pageSize = 10

  const fetchProducts = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const fetchedProducts = await getProductsBySellerId(user.uid)
      setProducts(fetchedProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchQuotations = async (direction: "first" | "next" | "prev" = "first") => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const quotationsRef = collection(db, "quotations")
      let q

      if (direction === "first") {
        q = query(quotationsRef, where("created_by", "==", user.uid), orderBy("created", "desc"), limit(pageSize + 1))
      } else if (direction === "next" && lastVisible) {
        q = query(
          quotationsRef,
          where("created_by", "==", user.uid),
          orderBy("created", "desc"),
          startAfter(lastVisible),
          limit(pageSize + 1),
        )
      } else if (direction === "prev" && pageHistory.length > 0) {
        const prevDoc = pageHistory[pageHistory.length - 1]
        q = query(
          quotationsRef,
          where("created_by", "==", user.uid),
          orderBy("created", "desc"),
          startAfter(prevDoc),
          limit(pageSize + 1),
        )
      } else {
        setLoading(false)
        return
      }

      const querySnapshot = await getDocs(q)
      const fetchedQuotations: any[] = []

      querySnapshot.forEach((doc) => {
        fetchedQuotations.push({ id: doc.id, ...doc.data() })
      })

      const newHasMore = fetchedQuotations.length > pageSize

      if (newHasMore) {
        fetchedQuotations.pop()
      }

      const docs = querySnapshot.docs.slice(0, pageSize)
      const newLastVisible = docs[docs.length - 1] || null
      const newFirstVisible = docs[0] || null

      setQuotations(fetchedQuotations)
      setLastVisible(newLastVisible)
      setFirstVisible(newFirstVisible)
      setHasMore(newHasMore)

      if (direction === "first") {
        setCurrentPage(1)
        setPageHistory([])
      } else if (direction === "next") {
        setCurrentPage((prev) => prev + 1)
        if (firstVisible) {
          setPageHistory((prev) => [...prev, firstVisible])
        }
      } else if (direction === "prev") {
        setCurrentPage((prev) => prev - 1)
        setPageHistory((prev) => prev.slice(0, -1))
      }
    } catch (error) {
      console.error("Error fetching quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchProducts()
      fetchQuotations("first")
    }
  }, [user?.uid])

  const handleNextPage = () => {
    if (hasMore && !loading) {
      fetchQuotations("next")
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && !loading) {
      fetchQuotations("prev")
    }
  }

  const handleProductSelect = (product: Product) => {
    setSelectedSites((prev) =>
      prev.some((site) => site.id === product.id) ? prev.filter((site) => site.id !== product.id) : [...prev, product],
    )
  }

  const handleRemoveSelectedSite = (productId: string) => {
    setSelectedSites((prev) => prev.filter((site) => site.id !== productId))
  }

  const handleDatesSelected = async () => {
    if (!dateRange?.from || !dateRange?.to || selectedSites.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a date range and at least one product.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingQuotation(true)
    try {
      const quotationNumber = generateQuotationNumber()
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30) // Valid for 30 days

      const quotationItems: QuotationItem[] = selectedSites.map((site) => {
        const { durationDays, itemTotalAmount } = calculateItemTotal(
          dateRange.from!.toISOString(),
          dateRange.to!.toISOString(),
          site.price_per_day, // This is now treated as monthly price
        )

        return {
          product_id: site.id!,
          product_name: site.name,
          product_location: site.specs_rental?.location || site.light?.location || "N/A",
          site_code: site.site_code,
          price: site.price_per_day, // Store the monthly price
          duration_days: durationDays,
          item_total_amount: itemTotalAmount,
          type: site.type,
          media_url: site.media?.[0]?.url,
          start_date: dateRange.from!.toISOString(),
          end_date: dateRange.to!.toISOString(),
        }
      })

      const overallTotalAmount = calculateQuotationTotal(quotationItems)
      const overallDurationDays = quotationItems.length > 0 ? quotationItems[0].duration_days : 0 // Assuming consistent duration

      const quotationData = {
        quotation_number: quotationNumber,
        items: quotationItems,
        total_amount: overallTotalAmount,
        duration_days: overallDurationDays,
        status: "draft",
        created_by: user?.uid,
        created_by_first_name: user?.first_name,
        created_by_last_name: user?.last_name,
        client_name: "N/A", // Placeholder, will be updated later
        client_email: "N/A", // Placeholder, will be updated later
        valid_until: validUntil,
        seller_id: user?.uid,
      }

      const newQuotationId = await createQuotation(quotationData)
      toast({
        title: "Success",
        description: `Quotation ${quotationNumber} created successfully!`,
      })
      router.push(`/sales/quotations/${newQuotationId}`)
    } catch (error) {
      console.error("Error creating quotation:", error)
      toast({
        title: "Error",
        description: "Failed to create quotation.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingQuotation(false)
    }
  }

  const allProductTypes = useMemo(() => {
    const types = new Set<string>()
    products.forEach((product) => {
      if (product.type) {
        types.add(product.type)
      }
    })
    return Array.from(types)
  }, [products])

  const filteredProducts = useMemo(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.site_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.specs_rental?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.light?.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedProductTypes.length > 0) {
      filtered = filtered.filter((product) => product.type && selectedProductTypes.includes(product.type))
    }

    return filtered
  }, [products, searchTerm, selectedProductTypes])

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM d, yyyy")
      }
      if (typeof date === "string") {
        return format(new Date(date), "MMM d, yyyy")
      }
      return "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "expired":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "viewed":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sales Dashboard</h1>

        {/* Quotation Creation Section */}
        <Card className="mb-8 border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-900">Create New Quotation</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Products</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search products by name, site code, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-full"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Filter className="h-4 w-4" /> Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <ScrollArea className="h-[200px]">
                        {allProductTypes.map((type) => (
                          <DropdownMenuCheckboxItem
                            key={type}
                            checked={selectedProductTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              setSelectedProductTypes((prev) =>
                                checked ? [...prev, type] : prev.filter((t) => t !== type),
                              )
                            }}
                          >
                            {type}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <ScrollArea className="h-[300px] border border-gray-200 rounded-md p-4">
                  {loading ? (
                    <div className="space-y-3">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div className="space-y-3">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border border-gray-100 rounded-md bg-white shadow-sm hover:bg-gray-50 transition-colors"
                        >
                          <Label htmlFor={`product-${product.id}`} className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                              id={`product-${product.id}`}
                              checked={selectedSites.some((site) => site.id === product.id)}
                              onCheckedChange={() => handleProductSelect(product)}
                            />
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">
                                {product.site_code} - {product.specs_rental?.location || product.light?.location}
                              </p>
                            </div>
                          </Label>
                          <Badge variant="secondary" className="text-xs">
                            ₱{product.price_per_day?.toLocaleString()} / month
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No products found matching your criteria.</p>
                  )}
                </ScrollArea>
              </div>

              {/* Selected Products & Date Range */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Products & Duration</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date-range" className="text-sm font-medium text-gray-700 mb-2 block">
                      Select Booking Dates
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange?.from && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        {/* Calendar component should be imported and used here */}
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="border border-gray-200 rounded-md p-4 min-h-[150px]">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Products for Quotation:</h4>
                    {selectedSites.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedSites.map((site) => (
                          <li key={site.id} className="flex items-center justify-between text-sm text-gray-700">
                            <span>
                              {site.name} ({site.site_code})
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSelectedSite(site.id!)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No products selected yet.</p>
                    )}
                  </div>

                  <Button
                    onClick={handleDatesSelected}
                    disabled={!dateRange?.from || !dateRange?.to || selectedSites.length === 0 || isCreatingQuotation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
                  >
                    {isCreatingQuotation ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating Quotation...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4" /> Generate Quotation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Quotations List */}
        <Card className="border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-900">Recent Quotations</CardTitle>
          </CardHeader>
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(pageSize)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i} className="border-b border-gray-100">
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : quotations.length > 0 ? (
            <>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quotation) => (
                      <TableRow
                        key={quotation.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/sales/quotations/${quotation.id}`)}
                      >
                        <TableCell className="py-3 text-sm text-gray-700">{formatDate(quotation.created)}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-700">{quotation.client_name || "N/A"}</TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quotation.status)}`}
                          >
                            {quotation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-gray-700">
                          ₱{quotation.total_amount?.toLocaleString() || "0.00"}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-gray-700">
                          {quotation.quotation_number || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="flex justify-between items-center p-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-gray-700">Page {currentPage}</span>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <CardContent className="p-6 text-center text-gray-600">
              <p>No quotations found for your account.</p>
            </CardContent>
          )}
        </Card>
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow">
            <p>Loading quotations...</p>
          </div>
        </div>
      )}
    </div>
  )
}
