"use client"

import { useEffect, useMemo, useState } from "react"
import { formatCurrency } from "./utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, PencilLine, Check, X, Eye, EyeOff, Filter, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { bookingService, type SalesRecord } from "@/lib/booking-service"

// Mock company ID - in real app, this would come from auth context
const COMPANY_ID = "kV2aoZN1xqvw7qv7oNgm"

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

function sumBy(records: SalesRecord[], accessor: (record: SalesRecord) => number): number {
  return records.reduce((sum, record) => sum + accessor(record), 0)
}

export function SalesRecordTable() {
  const { toast } = useToast()
  const [records, setRecords] = useState<SalesRecord[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [showComputed, setShowComputed] = useState(true)

  // Auto-switch to cards on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode("cards")
      } else {
        setViewMode("table")
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const loadSalesRecords = async () => {
    try {
      setLoading(true)
      const salesRecords = await bookingService.getSalesRecords(COMPANY_ID)
      setRecords(salesRecords)
      toast({
        title: "✅ Data Loaded",
        description: `Loaded ${salesRecords.length} sales records from bookings.`,
      })
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
    loadSalesRecords()
  }, [])

  const filtered = useMemo(() => records.filter((r) => includesAny(r, query)), [records, query])

  const totals = useMemo(() => {
    const base = filtered.length ? filtered : records
    return {
      netSales: sumBy(base, (r) => r.netSales),
      outputVat: sumBy(base, (r) => r.outputVat),
      total: sumBy(base, (r) => r.total),
      creditableTax: sumBy(base, (r) => r.creditableTax),
      amountCollected: sumBy(base, (r) => r.amountCollected),
    }
  }, [filtered, records])

  function updateRecord(id: string, patch: Partial<SalesRecord>) {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, ...patch }

        // Recalculate computed values if netSales changed
        if (patch.netSales !== undefined) {
          const netSales = patch.netSales
          updated.outputVat = netSales * 0.12
          updated.total = netSales + updated.outputVat
          updated.creditableTax = netSales * 0.02
          updated.amountCollected = updated.total - updated.creditableTax
        }

        return updated
      }),
    )
  }

  function toggleEdit(id: string, state?: boolean) {
    setEditing((prev) => ({ ...prev, [id]: state ?? !prev[id] }))
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
      "Quantity",
    ]

    const csvContent = [
      headers.join(","),
      ...filtered.map((record) =>
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
            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
            <h3 className="text-lg font-medium mb-2">Loading Sales Records</h3>
            <p className="text-sm text-muted-foreground">Fetching completed bookings...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Sales Records</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filtered.length} of {records.length} records from completed bookings
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComputed(!showComputed)}
                  className="hidden lg:flex"
                >
                  {showComputed ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showComputed ? "Hide" : "Show"} Computed
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
                  className="hidden lg:flex"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {viewMode === "table" ? "Card View" : "Table View"}
                </Button>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button onClick={loadSalesRecords} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="ml-auto bg-transparent">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Sales</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(totals.netSales)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-green-700 dark:text-green-300">Output VAT</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(totals.outputVat)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Total</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(totals.total)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Creditable Tax</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {formatCurrency(totals.creditableTax)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-teal-700 dark:text-teal-300">Amount Collected</div>
            <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
              {formatCurrency(totals.amountCollected)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Display */}
      {viewMode === "cards" ? (
        <CardsView records={filtered} editing={editing} onEdit={toggleEdit} onUpdate={updateRecord} />
      ) : (
        <TableView
          records={filtered}
          editing={editing}
          showComputed={showComputed}
          onEdit={toggleEdit}
          onUpdate={updateRecord}
        />
      )}

      {filtered.length === 0 && !loading && (
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

function CardsView({
  records,
  editing,
  onEdit,
  onUpdate,
}: {
  records: SalesRecord[]
  editing: Record<string, boolean>
  onEdit: (id: string, state?: boolean) => void
  onUpdate: (id: string, patch: Partial<SalesRecord>) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {records.map((record) => {
        const isEditing = !!editing[record.id]
        return (
          <Card
            key={record.id}
            className={`bg-white dark:bg-slate-800 transition-all duration-200 ${isEditing ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{record.clients}</CardTitle>
                  <p className="text-sm text-muted-foreground">{record.serviceInvoice}</p>
                  <Badge variant="secondary" className="mt-1">
                    {record.productType}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(record.id, false)}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(record.id, false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(record.id, true)}>
                      <PencilLine className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Month"
                  value={record.month}
                  editing={isEditing}
                  onChange={(v) => onUpdate(record.id, { month: v })}
                />
                <Field
                  label="Date"
                  value={record.date}
                  editing={isEditing}
                  onChange={(v) => onUpdate(record.id, { date: v })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="BS Number"
                  value={record.bsNumber}
                  editing={isEditing}
                  onChange={(v) => onUpdate(record.id, { bsNumber: v })}
                />
                <Field
                  label="OR Number"
                  value={record.orNo}
                  editing={isEditing}
                  onChange={(v) => onUpdate(record.id, { orNo: v })}
                />
              </div>

              <Field
                label="TIN"
                value={record.tin}
                editing={isEditing}
                onChange={(v) => onUpdate(record.id, { tin: v })}
              />

              <Field
                label="Description"
                value={record.description}
                editing={false} // Keep description read-only as it comes from booking
                onChange={() => {}}
              />

              <Field
                label="Net Sales"
                value={String(record.netSales)}
                editing={isEditing}
                numeric
                onChange={(v) => onUpdate(record.id, { netSales: Number.parseFloat(v) || 0 })}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Payment Method
                  </div>
                  <div className="text-sm font-medium">{record.paymentMethod}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity</div>
                  <div className="text-sm font-medium">{record.quantity}</div>
                </div>
              </div>

              {/* Computed Values */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Computed Values</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Output VAT</div>
                    <div className="font-medium">{formatCurrency(record.outputVat)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-medium">{formatCurrency(record.total)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Creditable Tax</div>
                    <div className="font-medium">{formatCurrency(record.creditableTax)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Amount Collected</div>
                    <div className="font-medium">{formatCurrency(record.amountCollected)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function TableView({
  records,
  editing,
  showComputed,
  onEdit,
  onUpdate,
}: {
  records: SalesRecord[]
  editing: Record<string, boolean>
  showComputed: boolean
  onEdit: (id: string, state?: boolean) => void
  onUpdate: (id: string, patch: Partial<SalesRecord>) => void
}) {
  return (
    <Card className="bg-white dark:bg-slate-800">
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
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const isEditing = !!editing[record.id]
              return (
                <TableRow
                  key={record.id}
                  className={`transition-colors ${isEditing ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={record.month}
                        onChange={(e) => onUpdate(record.id, { month: e.target.value })}
                        className="w-20"
                      />
                    ) : (
                      <span>{record.month || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={record.date}
                        onChange={(e) => onUpdate(record.id, { date: e.target.value })}
                        className="w-20"
                      />
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
                        onChange={(e) => onUpdate(record.id, { bsNumber: e.target.value })}
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
                      <Input
                        value={record.tin}
                        onChange={(e) => onUpdate(record.id, { tin: e.target.value })}
                        className="w-36"
                      />
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
                        onChange={(e) => onUpdate(record.id, { netSales: Number.parseFloat(e.target.value) || 0 })}
                      />
                    ) : (
                      <span className="font-mono font-medium">{formatCurrency(record.netSales)}</span>
                    )}
                  </TableCell>
                  {showComputed && (
                    <>
                      <TableCell className="text-right">
                        <span className="font-mono text-green-700 dark:text-green-400">
                          {formatCurrency(record.outputVat)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono font-medium">{formatCurrency(record.total)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-orange-700 dark:text-orange-400">
                          {formatCurrency(record.creditableTax)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-blue-700 dark:text-blue-400">
                          {formatCurrency(record.amountCollected)}
                        </span>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={record.orNo}
                        onChange={(e) => onUpdate(record.id, { orNo: e.target.value })}
                        className="w-24"
                      />
                    ) : (
                      <span className="font-mono text-sm">{record.orNo}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{record.paymentMethod}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {record.productType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(record.id, false)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(record.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(record.id, true)}>
                          <PencilLine className="h-4 w-4" />
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
    </Card>
  )
}

function Field({
  label,
  value,
  editing,
  onChange,
  numeric,
}: {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
  numeric?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {editing ? (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          inputMode={numeric ? "decimal" : "text"}
          type={numeric ? "number" : "text"}
          className="bg-slate-50 dark:bg-slate-900"
        />
      ) : (
        <div className="text-sm font-medium min-h-[20px]">{value || "-"}</div>
      )}
    </div>
  )
}
