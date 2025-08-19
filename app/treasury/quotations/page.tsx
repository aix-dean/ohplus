"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search, X, ChevronsLeft, ChevronsRight, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CollectibleFormData {
  client_name: string
  net_amount: string
  total_amount: string
  invoice_no: string
  or_no: string
  bi_no: string
  mode_of_payment: string
  bank_name: string
  collection_date: string
  site: string
  booking_no: string
  vendor_name: string
  business_address: string
  tin_no: string
  product_name: string
  covered_period: string
}

export default function TreasuryQuotationsPage() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [allQuotations, setAllQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [signingQuotes, setSigningQuotes] = useState<Set<string>>(new Set())
  const [showCollectiblesModal, setShowCollectiblesModal] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null)
  const [collectibleFormData, setCollectibleFormData] = useState<CollectibleFormData>({
    client_name: "",
    net_amount: "",
    total_amount: "",
    invoice_no: "",
    or_no: "",
    bi_no: "",
    mode_of_payment: "Credit/Debit Card",
    bank_name: "",
    collection_date: "",
    site: "",
    booking_no: "",
    vendor_name: "",
    business_address: "",
    tin_no: "",
    product_name: "",
    covered_period: "",
  })
  const router = useRouter()
  const pageSize = 10
  const { toast } = useToast()

  const filteredQuotations = useMemo(() => {
    let filtered = allQuotations

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (quotation) =>
          quotation.client_name?.toLowerCase().includes(searchLower) ||
          quotation.client_phone?.toLowerCase().includes(searchLower) ||
          quotation.quotation_number?.toLowerCase().includes(searchLower) ||
          quotation.client_address?.toLowerCase().includes(searchLower),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((quotation) => quotation.status?.toLowerCase() === statusFilter)
    }

    return filtered
  }, [allQuotations, searchTerm, statusFilter])

  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredQuotations.slice(startIndex, endIndex)
  }, [filteredQuotations, currentPage, pageSize])

  const totalPages = Math.ceil(filteredQuotations.length / pageSize)

  const fetchAllQuotations = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const quotationsRef = collection(db, "quotations")
      const q = query(
        quotationsRef,
        where("created_by", "==", user.uid),
        where("projectCompliance.signedQuotation.status", "==", "completed"),
        orderBy("created", "desc"),
      )

      const querySnapshot = await getDocs(q)
      const fetchedQuotations: any[] = []

      querySnapshot.forEach((doc) => {
        fetchedQuotations.push({ id: doc.id, ...doc.data() })
      })

      setAllQuotations(fetchedQuotations)
    } catch (error) {
      console.error("Error fetching quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchAllQuotations()
    }
  }, [user?.uid])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

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

  const handleQuoteSigned = async (quotation: any) => {
    if (!quotation.id || !user?.uid) return

    try {
      // Get the full quotation details
      const quotationRef = doc(db, "quotations", quotation.id)
      const quotationDoc = await getDoc(quotationRef)

      if (!quotationDoc.exists()) {
        throw new Error("Quotation not found")
      }

      const fullQuotationData = quotationDoc.data()

      // Pre-populate form with quotation data
      setCollectibleFormData({
        client_name: quotation.client_name || fullQuotationData.client_name || "",
        net_amount: quotation.total_amount?.toString() || "",
        total_amount: quotation.total_amount?.toString() || "",
        invoice_no: `INV-${quotation.quotation_number || Date.now()}`,
        or_no: `OR-${Date.now()}`,
        bi_no: `BI-${Date.now()}`,
        mode_of_payment: "Credit/Debit Card",
        bank_name: "",
        collection_date: new Date().toISOString().split("T")[0],
        site: "",
        booking_no: `BK-${quotation.quotation_number || Date.now()}`,
        vendor_name: quotation.client_name || fullQuotationData.client_name || "",
        business_address: quotation.client_address || fullQuotationData.client_address || "",
        tin_no: "",
        product_name: fullQuotationData.items?.[0]?.name || "",
        covered_period: `${fullQuotationData.start_date?.split("T")[0] || new Date().toISOString().split("T")[0]} - ${fullQuotationData.end_date?.split("T")[0] || new Date().toISOString().split("T")[0]}`,
      })

      setSelectedQuotation(quotation)
      setShowCollectiblesModal(true)
    } catch (error) {
      console.error("Error preparing collectibles form:", error)
      toast({
        title: "Error",
        description: "Failed to prepare collectibles form. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateCollectible = async () => {
    if (!selectedQuotation?.id || !user?.uid) return

    setSigningQuotes((prev) => new Set(prev).add(selectedQuotation.id))

    try {
      const collectibleData = {
        // Basic information
        client_name: collectibleFormData.client_name,
        company_id: user.company_id || user.uid,
        type: "sites",

        // Financial data
        net_amount: Number.parseFloat(collectibleFormData.net_amount) || 0,
        total_amount: Number.parseFloat(collectibleFormData.total_amount) || 0,

        // Document references
        invoice_no: collectibleFormData.invoice_no,
        or_no: collectibleFormData.or_no,
        bi_no: collectibleFormData.bi_no,

        // Payment information
        mode_of_payment: collectibleFormData.mode_of_payment,
        bank_name: collectibleFormData.bank_name,

        // Status and dates
        status: "pending",
        collection_date: Timestamp.fromDate(new Date(collectibleFormData.collection_date)),
        covered_period: collectibleFormData.covered_period,

        // Sites-specific fields
        site: collectibleFormData.site,
        booking_no: collectibleFormData.booking_no,

        // Additional fields
        vendor_name: collectibleFormData.vendor_name,
        business_address: collectibleFormData.business_address,
        tin_no: collectibleFormData.tin_no,

        // System fields
        deleted: false,
        created: serverTimestamp(),
        updated: serverTimestamp(),

        // Reference to original quotation
        quotation_id: selectedQuotation.id,
        quotation_number: selectedQuotation.quotation_number,
        product_name: collectibleFormData.product_name,
      }

      await addDoc(collection(db, "collectibles"), collectibleData)

      toast({
        title: "Success",
        description: "Collectible document created successfully!",
      })

      setShowCollectiblesModal(false)
      setSelectedQuotation(null)
    } catch (error) {
      console.error("Error creating collectible:", error)
      toast({
        title: "Error",
        description: "Failed to create collectible document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSigningQuotes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(selectedQuotation.id)
        return newSet
      })
    }
  }

  const handleFormChange = (field: keyof CollectibleFormData, value: string) => {
    setCollectibleFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {user?.uid ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Treasury Signed Contracts</CardTitle>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by client, phone, or contract reference..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 w-full sm:w-80"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                    </SelectContent>
                  </Select>

                  {(searchTerm || statusFilter !== "all") && (
                    <Button variant="outline" onClick={clearFilters} size="sm">
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>

              {!loading && (
                <div className="text-sm text-gray-600 mt-2">
                  Showing {paginatedQuotations.length} of {filteredQuotations.length} signed contracts
                  {filteredQuotations.length !== allQuotations.length &&
                    ` (filtered from ${allQuotations.length} total)`}
                </div>
              )}
            </CardHeader>

            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-3">Contract Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Client Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Contract Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Contract Reference</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
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
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : paginatedQuotations.length > 0 ? (
              <>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-900 py-3">Contract Date</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Client Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Contract Amount</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Contract Reference</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedQuotations.map((quotation) => (
                        <TableRow key={quotation.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/treasury/quotations/${quotation.id}`)}
                          >
                            {formatDate(quotation.created)}
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/treasury/quotations/${quotation.id}`)}
                          >
                            {quotation.client_name || "N/A"}
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/treasury/quotations/${quotation.id}`)}
                          >
                            ₱{quotation.total_amount?.toLocaleString() || "0.00"}
                          </TableCell>
                          <TableCell
                            className="py-3 text-sm text-gray-700 cursor-pointer"
                            onClick={() => router.push(`/treasury/quotations/${quotation.id}`)}
                          >
                            {quotation.quotation_number || "N/A"}
                          </TableCell>
                          <TableCell className="py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuoteSigned(quotation)
                              }}
                              disabled={signingQuotes.has(quotation.id)}
                              className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                            >
                              {signingQuotes.has(quotation.id) ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Create Collectible
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="hidden sm:flex"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="hidden sm:flex"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="p-6 text-center text-gray-600">
                {searchTerm || statusFilter !== "all" ? (
                  <div>
                    <p className="mb-2">No signed contracts found matching your filters.</p>
                    <Button variant="outline" onClick={clearFilters} size="sm">
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <p>No signed contracts found for your account.</p>
                )}
              </CardContent>
            )}
          </Card>
        ) : (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-6 text-center text-gray-600">
              <p>Please log in to view your signed contracts.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCollectiblesModal} onOpenChange={setShowCollectiblesModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Collectible Document</DialogTitle>
            <DialogDescription>
              Manually enter the collectible information for quotation: {selectedQuotation?.quotation_number}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={collectibleFormData.client_name}
                  onChange={(e) => handleFormChange("client_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor_name">Vendor Name</Label>
                <Input
                  id="vendor_name"
                  value={collectibleFormData.vendor_name}
                  onChange={(e) => handleFormChange("vendor_name", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="net_amount">Net Amount</Label>
                <Input
                  id="net_amount"
                  type="number"
                  step="0.01"
                  value={collectibleFormData.net_amount}
                  onChange={(e) => handleFormChange("net_amount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={collectibleFormData.total_amount}
                  onChange={(e) => handleFormChange("total_amount", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_no">Invoice No.</Label>
                <Input
                  id="invoice_no"
                  value={collectibleFormData.invoice_no}
                  onChange={(e) => handleFormChange("invoice_no", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="or_no">OR No.</Label>
                <Input
                  id="or_no"
                  value={collectibleFormData.or_no}
                  onChange={(e) => handleFormChange("or_no", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bi_no">BI No.</Label>
                <Input
                  id="bi_no"
                  value={collectibleFormData.bi_no}
                  onChange={(e) => handleFormChange("bi_no", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mode_of_payment">Mode of Payment</Label>
                <Select
                  value={collectibleFormData.mode_of_payment}
                  onValueChange={(value) => handleFormChange("mode_of_payment", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={collectibleFormData.bank_name}
                  onChange={(e) => handleFormChange("bank_name", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collection_date">Collection Date</Label>
                <Input
                  id="collection_date"
                  type="date"
                  value={collectibleFormData.collection_date}
                  onChange={(e) => handleFormChange("collection_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input
                  id="site"
                  value={collectibleFormData.site}
                  onChange={(e) => handleFormChange("site", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking_no">Booking No.</Label>
                <Input
                  id="booking_no"
                  value={collectibleFormData.booking_no}
                  onChange={(e) => handleFormChange("booking_no", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tin_no">TIN No.</Label>
                <Input
                  id="tin_no"
                  value={collectibleFormData.tin_no}
                  onChange={(e) => handleFormChange("tin_no", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                value={collectibleFormData.product_name}
                onChange={(e) => handleFormChange("product_name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_address">Business Address</Label>
              <Textarea
                id="business_address"
                value={collectibleFormData.business_address}
                onChange={(e) => handleFormChange("business_address", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="covered_period">Covered Period</Label>
              <Input
                id="covered_period"
                value={collectibleFormData.covered_period}
                onChange={(e) => handleFormChange("covered_period", e.target.value)}
                placeholder="YYYY-MM-DD - YYYY-MM-DD"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectiblesModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollectible} disabled={signingQuotes.has(selectedQuotation?.id)}>
              {signingQuotes.has(selectedQuotation?.id) ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Creating...
                </>
              ) : (
                "Create Collectible"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
