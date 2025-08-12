"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Search, Download, Edit, Save, X, Eye, EyeOff, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { sumBy } from "lodash"
import {
  bookingService,
  type SalesRecord,
  type PaginationOptions,
  type PaginatedResult,
  type FilterOptions,
} from "@/lib/booking-service"
import { useAuth } from "@/contexts/auth-context"

const BOOKING_TYPES = ["RENTAL", "MERCHANDISE", "SERVICES"] as const
const BOOKING_STATUSES = ["COMPLETED", "CANCELLED", "FOR CONTRACT", "ONGOING", "PENDING", "PAID", "UPCOMING"] as const

function includesAny(record: SalesRecord, query: string): boolean {
  if (!query) return true
  const searchQuery = query.toLowerCase()
  return (
    record.clients.toLowerCase().includes(searchQuery) ||
    record.serviceInvoice.toLowerCase().includes(searchQuery) ||
    record.bsNumber.toLowerCase().includes(searchQuery) ||
    record.description.toLowerCase().includes(searchQuery) ||
    record.tin.toLowerCase().includes(searchQuery) ||
    record.orNo.toLowerCase().includes(searchQuery) ||
    record.paymentMethod.toLowerCase().includes(searchQuery) ||
    record.productType.toLowerCase().includes(searchQuery)
  )
}

export function SalesRecordTable() {
  const { userData } = useAuth()
  const { toast } = useToast()
  const [records, setRecords] = useState<SalesRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [showComputed, setShowComputed] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)

  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const loadSalesRecords = async (page = 1) => {
    if (!userData?.company_id) {
      toast({
        title: "❌ Error",
        description: "No company ID found. Please contact support.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const options: PaginationOptions = {
        page,
        pageSize,
        lastDoc: page > 1 ? lastDoc : undefined,
      }

      const filters: FilterOptions = {}
      if (typeFilter !== "all") filters.type = typeFilter
      if (statusFilter !== "all") filters.status = statusFilter

      const result: PaginatedResult<SalesRecord> = await bookingService.getPaginatedSalesRecords(
        userData.company_id,
        options,
        filters,
      )

      setRecords(result.data)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setHasNextPage(result.hasNextPage)
      setHasPreviousPage(result.hasPreviousPage)
      setCurrentPage(result.currentPage)
      setLastDoc(result.lastDoc)
    } catch (error) {
      console.error("Error loading sales records:", error)
      toast({
        title: "❌ Error",
        description: "Failed to load sales records. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userData?.company_id) {
      loadSalesRecords(1)
    }
  }, [userData?.company_id])

  useEffect(() => {
    if (userData?.company_id) {
      setCurrentPage(1)
      loadSalesRecords(1)
    }
  }, [typeFilter, statusFilter])

  const filtered = useMemo(() => records.filter((r) => includesAny(r, query)), [records, query])

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      loadSalesRecords(newPage)
    }
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      loadSalesRecords(newPage)
    }
  }

  const handlePageRefresh = () => {
    loadSalesRecords(currentPage)
  }

  const handleClearFilters = () => {
    setTypeFilter("all")
    setStatusFilter("all")
  }

  const exportToCSV = () => {
    const headers = [
      "Month",
      "Date",
      "Service Invoice",
      "BS Number",
      "Client",
      "TIN",
      "Description",
      "Net Sales",
      "Output VAT",
      "Total",
      "Creditable Tax",
      "Amount Collected",
      "OR Number",
      "Paid Date",
      "Payment Method",
      "Product Type",
      "Status",
      "Quantity",
    ]

    const csvContent = [
      headers.join(","),
      ...records.map((record) =>
        [
          record.month,
          record.date,
          record.serviceInvoice,
          record.bsNumber,
          `"${record.clients}"`,
          record.tin,
          `"${record.description}"`,
          record.netSales,
          record.outputVat,
          record.total,
          record.creditableTax,
          record.amountCollected,
          record.orNo,
          record.paidDate,
          record.paymentMethod,
          record.productType,
          record.status,
          record.quantity,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-records-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "📊 Export Complete",
      description: "Sales records exported to CSV file.",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50"></div>
            <h3 className="text-lg font-medium mb-2">Loading Sales Records</h3>
            <p className="text-sm text-muted-foreground">Fetching completed bookings...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sales Record</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {records.length} of {totalCount} sales records (Page {currentPage} of {totalPages})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowComputed(!showComputed)}>
            {showComputed ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showComputed ? "Hide" : "Show"} Computed
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePageRefresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Sales</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {sumBy(records, (r) => r.netSales)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-green-700 dark:text-green-300">Output VAT</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {sumBy(records, (r) => r.outputVat)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Total</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {sumBy(records, (r) => r.total)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Creditable Tax</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {sumBy(records, (r) => r.creditableTax)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-teal-700 dark:text-teal-300">Amount Collected</div>
            <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
              {sumBy(records, (r) => r.amountCollected)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search records..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {BOOKING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {BOOKING_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(typeFilter !== "all" || statusFilter !== "all") && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-semibold">Month</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold">BS #</TableHead>
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">TIN</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold text-right">Net Sales</TableHead>
                  {showComputed && (
                    <>
                      <TableHead className="font-semibold text-right">Output VAT</TableHead>
                      <TableHead className="font-semibold text-right">Total</TableHead>
                      <TableHead className="font-semibold text-right">Creditable Tax</TableHead>
                      <TableHead className="font-semibold text-right">Amount Collected</TableHead>
                    </>
                  )}
                  <TableHead className="font-semibold">OR No.</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query ? filtered : records).map((record) => {
                  const isEditing = !!editing[record.id]
                  return (
                    <TableRow
                      key={record.id}
                      className={`transition-colors ${isEditing ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                    >
                      <TableCell>
                        {isEditing ? (
                          <Input value={record.month} onChange={(e) => console.log(e.target.value)} className="w-20" />
                        ) : (
                          <span>{record.month || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input value={record.date} onChange={(e) => console.log(e.target.value)} className="w-20" />
                        ) : (
                          <span>{record.date || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{record.serviceInvoice}</span>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={record.bsNumber}
                            onChange={(e) => console.log(e.target.value)}
                            className="w-24"
                          />
                        ) : (
                          <span className="font-mono text-sm">{record.bsNumber}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-40">
                          <span className="font-medium">{record.clients}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input value={record.tin} onChange={(e) => console.log(e.target.value)} className="w-36" />
                        ) : (
                          <span className="font-mono text-sm">{record.tin || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          <span className="text-sm">{record.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            inputMode="decimal"
                            className="text-right w-32"
                            value={record.netSales}
                            onChange={(e) => console.log(e.target.value)}
                          />
                        ) : (
                          <span className="font-mono font-medium">{record.netSales}</span>
                        )}
                      </TableCell>
                      {showComputed && (
                        <>
                          <TableCell className="text-right">
                            <span className="font-mono text-green-700 dark:text-green-400">{record.outputVat}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono font-medium">{record.total}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-orange-700 dark:text-orange-400">
                              {record.creditableTax}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-blue-700 dark:text-blue-400">{record.amountCollected}</span>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        {isEditing ? (
                          <Input value={record.orNo} onChange={(e) => console.log(e.target.value)} className="w-24" />
                        ) : (
                          <span className="font-mono text-sm">{record.orNo}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{record.paymentMethod}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{record.productType}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            record.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : record.status === "CANCELLED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                : record.status === "ONGOING"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                  : record.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : record.status === "PAID"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          }`}
                        >
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => console.log("Save")}
                              >
                                <Save className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => console.log("Cancel")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => console.log("Edit")}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
          entries
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={!hasPreviousPage || loading}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasNextPage || loading}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* No Records Found */}
      {records.length === 0 && !loading && (
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No records found</h3>
              <p className="text-sm">Try adjusting your search or refresh the data.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Added default export for backward compatibility
export default SalesRecordTable
