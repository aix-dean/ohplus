"use client"

import { useEffect, useMemo, useState } from "react"
import { uid, parseNumber, sumBy, includesAny, formatCurrency } from "./utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Undo2, Search, Trash2, PencilLine, Check, X, Eye, EyeOff, Filter, Download } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

type SalesRecordRow = {
  id: string
  month: string
  date: string
  serviceInvoice: string
  bsNumber: string
  clients: string
  tin: string
  description: string
  netSales: number
  // computed (view only)
  outputVat: number
  total: number
  discount: number
  creditableTax: number
  amountCollected: number
  orNo: string
  paidDate: string
}

const STORAGE_KEY = "acc_sales_record_v1"

const MOCK_ROWS: SalesRecordRow[] = [
  {
    id: uid("sr"),
    month: "Dec",
    date: "13",
    serviceInvoice: "SI-2412001",
    bsNumber: "BS-1001",
    clients: "Acme Foods Inc.",
    tin: "123-456-789-000",
    description: "LED Billboard Rental - December",
    netSales: 100000,
    outputVat: 12000,
    total: 112000,
    discount: 0,
    creditableTax: 2000,
    amountCollected: 110000,
    orNo: "OR-5001",
    paidDate: "2024-12-14",
  },
  {
    id: uid("sr"),
    month: "Dec",
    date: "13",
    serviceInvoice: "SI-2412002",
    bsNumber: "BS-1002",
    clients: "ByteTech Corp.",
    tin: "987-654-321-000",
    description: "Static Billboard Rental - Dec",
    netSales: 50000,
    outputVat: 6000,
    total: 56000,
    discount: 0,
    creditableTax: 1000,
    amountCollected: 55000,
    orNo: "OR-5002",
    paidDate: "2024-12-15",
  },
]

function recompute(row: SalesRecordRow): SalesRecordRow {
  const net = parseNumber(row.netSales)
  const outputVat = net * 0.12
  const total = net + outputVat
  const creditableTax = net * 0.02
  const amountCollected = total - creditableTax
  return {
    ...row,
    outputVat,
    total,
    discount: 0,
    creditableTax,
    amountCollected,
  }
}

export function SalesRecordTable() {
  const { toast } = useToast()
  const [rows, setRows] = useState<SalesRecordRow[]>([])
  const [query, setQuery] = useState("")
  const [dirty, setDirty] = useState(false)
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showComputed, setShowComputed] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SalesRecordRow[]
        setRows(parsed.map(recompute))
      } catch {
        setRows(MOCK_ROWS.map(recompute))
      }
    } else {
      setRows(MOCK_ROWS.map(recompute))
    }
  }, [])

  // Auto-switch to cards on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('cards')
      } else {
        setViewMode('table')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filtered = useMemo(() => rows.filter((r) => includesAny(r, query)), [rows, query])

  const totals = useMemo(() => {
    const base = filtered.length ? filtered : rows
    return {
      netSales: sumBy(base, (r) => r.netSales),
      outputVat: sumBy(base, (r) => r.outputVat),
      total: sumBy(base, (r) => r.total),
      creditableTax: sumBy(base, (r) => r.creditableTax),
      amountCollected: sumBy(base, (r) => r.amountCollected),
    }
  }, [filtered, rows])

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
    setDirty(false)
    toast({ 
      title: "✅ Saved Successfully", 
      description: "Sales records have been saved to your browser." 
    })
  }

  function resetToMock() {
    setRows(MOCK_ROWS.map(recompute))
    setDirty(true)
    setEditing({})
    toast({ 
      title: "🔄 Data Loaded", 
      description: "Mock data has been loaded." 
    })
  }

  function addRow() {
    const newRow: SalesRecordRow = recompute({
      id: uid("sr"),
      month: "",
      date: "",
      serviceInvoice: "",
      bsNumber: "",
      clients: "",
      tin: "",
      description: "",
      netSales: 0,
      outputVat: 0,
      total: 0,
      discount: 0,
      creditableTax: 0,
      amountCollected: 0,
      orNo: "",
      paidDate: "",
    })
    setRows((r) => [newRow, ...r])
    setEditing((e) => ({ ...e, [newRow.id]: true }))
    setDirty(true)
  }

  function updateRow(id: string, patch: Partial<SalesRecordRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const next = { ...r, ...patch }
        return recompute(next)
      })
    )
    setDirty(true)
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
    setDirty(true)
    setEditing((e) => {
      const copy = { ...e }
      delete copy[id]
      return copy
    })
    toast({ 
      title: "🗑️ Record Deleted", 
      description: "Sales record has been removed." 
    })
  }

  function toggleEdit(id: string, state?: boolean) {
    setEditing((prev) => ({ ...prev, [id]: state ?? !prev[id] }))
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
                {filtered.length} of {rows.length} records
                {dirty && <Badge variant="secondary" className="ml-2">Unsaved changes</Badge>}
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
                  {showComputed ? 'Hide' : 'Show'} Computed
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                  className="hidden lg:flex"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {viewMode === 'table' ? 'Card View' : 'Table View'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button onClick={addRow} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Record
            </Button>
            <Button variant="outline" onClick={save} disabled={!dirty}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
            <Button variant="outline" onClick={resetToMock}>
              <Undo2 className="mr-2 h-4 w-4" /> Load Sample Data
            </Button>
            <Button variant="outline" className="ml-auto">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      

      {/* Data Display */}
      {viewMode === 'cards' ? (
        <CardsView 
          rows={filtered} 
          editing={editing} 
          onEdit={toggleEdit} 
          onUpdate={updateRow} 
          onDelete={deleteRow} 
        />
      ) : (
        <TableView 
          rows={filtered} 
          editing={editing} 
          showComputed={showComputed}
          onEdit={toggleEdit} 
          onUpdate={updateRow} 
          onDelete={deleteRow} 
        />
      )}

      {filtered.length === 0 && (
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No records found</h3>
              <p className="text-sm">Try adjusting your search or add a new record to get started.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CardsView({ 
  rows, 
  editing, 
  onEdit, 
  onUpdate, 
  onDelete 
}: {
  rows: SalesRecordRow[]
  editing: Record<string, boolean>
  onEdit: (id: string, state?: boolean) => void
  onUpdate: (id: string, patch: Partial<SalesRecordRow>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map((row) => {
        const isEditing = !!editing[row.id]
        return (
          <Card key={row.id} className={`bg-white dark:bg-slate-800 transition-all duration-200 ${isEditing ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{row.clients || "New Client"}</CardTitle>
                  <p className="text-sm text-muted-foreground">{row.serviceInvoice}</p>
                </div>
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(row.id, false)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(row.id, false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(row.id, true)}
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDelete(row.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Month"
                  value={row.month}
                  editing={isEditing}
                  onChange={(v) => onUpdate(row.id, { month: v })}
                />
                <Field
                  label="Date"
                  value={row.date}
                  editing={isEditing}
                  onChange={(v) => onUpdate(row.id, { date: v })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="BS Number"
                  value={row.bsNumber}
                  editing={isEditing}
                  onChange={(v) => onUpdate(row.id, { bsNumber: v })}
                />
                <Field
                  label="OR Number"
                  value={row.orNo}
                  editing={isEditing}
                  onChange={(v) => onUpdate(row.id, { orNo: v })}
                />
              </div>
              
              <Field
                label="Client Name"
                value={row.clients}
                editing={isEditing}
                onChange={(v) => onUpdate(row.id, { clients: v })}
              />
              
              <Field
                label="TIN"
                value={row.tin}
                editing={isEditing}
                onChange={(v) => onUpdate(row.id, { tin: v })}
              />
              
              <Field
                label="Description"
                value={row.description}
                editing={isEditing}
                onChange={(v) => onUpdate(row.id, { description: v })}
              />
              
              <Field
                label="Net Sales"
                value={String(row.netSales)}
                editing={isEditing}
                numeric
                onChange={(v) => onUpdate(row.id, { netSales: parseNumber(v) })}
              />
              
              <Field
                label="Paid Date"
                value={row.paidDate}
                editing={isEditing}
                onChange={(v) => onUpdate(row.id, { paidDate: v })}
              />
              
              {/* Computed Values */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Computed Values</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Output VAT</div>
                    <div className="font-medium">{formatCurrency(row.outputVat)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-medium">{formatCurrency(row.total)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Creditable Tax</div>
                    <div className="font-medium">{formatCurrency(row.creditableTax)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Amount Collected</div>
                    <div className="font-medium">{formatCurrency(row.amountCollected)}</div>
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
  rows, 
  editing, 
  showComputed,
  onEdit, 
  onUpdate, 
  onDelete 
}: {
  rows: SalesRecordRow[]
  editing: Record<string, boolean>
  showComputed: boolean
  onEdit: (id: string, state?: boolean) => void
  onUpdate: (id: string, patch: Partial<SalesRecordRow>) => void
  onDelete: (id: string) => void
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
              <TableHead className="font-semibold">Paid Date</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isEditing = !!editing[row.id]
              return (
                <TableRow 
                  key={row.id} 
                  className={`transition-colors ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <TableCell>
                    {isEditing ? (
                      <Input 
                        value={row.month} 
                        onChange={(e) => onUpdate(row.id, { month: e.target.value })}
                        className="w-20"
                      />
                    ) : (
                      <span>{row.month || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input 
                        value={row.date} 
                        onChange={(e) => onUpdate(row.id, { date: e.target.value })}
                        className="w-20"
                      />
                    ) : (
                      <span>{row.date || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={row.serviceInvoice}
                        onChange={(e) => onUpdate(row.id, { serviceInvoice: e.target.value })}
                        className="w-32"
                      />
                    ) : (
                      <span className="font-mono text-sm">{row.serviceInvoice || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input 
                        value={row.bsNumber} 
                        onChange={(e) => onUpdate(row.id, { bsNumber: e.target.value })}
                        className="w-24"
                      />
                    ) : (
                      <span className="font-mono text-sm">{row.bsNumber || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input 
                        value={row.clients} 
                        onChange={(e) => onUpdate(row.id, { clients: e.target.value })}
                        className="w-40"
                      />
                    ) : (
                      <div className="max-w-40">
                        <span className="font-medium">{row.clients || "-"}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input 
                        value={row.tin} 
                        onChange={(e) => onUpdate(row.id, { tin: e.target.value })}
                        className="w-36"
                      />
                    ) : (
                      <span className="font-mono text-sm">{row.tin || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={row.description}
                        onChange={(e) => onUpdate(row.id, { description: e.target.value })}
                        className="w-48"
                      />
                    ) : (
                      <div className="max-w-48">
                        <span className="text-sm">{row.description || "-"}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="text-right w-32"
                        value={row.netSales}
                        onChange={(e) => onUpdate(row.id, { netSales: parseNumber(e.target.value) })}
                      />
                    ) : (
                      <span className="font-mono font-medium">{formatCurrency(row.netSales)}</span>
                    )}
                  </TableCell>
                  {showComputed && (
                    <>
                      <TableCell className="text-right">
                        <span className="font-mono text-green-700 dark:text-green-400">{formatCurrency(row.outputVat)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono font-medium">{formatCurrency(row.total)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-orange-700 dark:text-orange-400">{formatCurrency(row.creditableTax)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-blue-700 dark:text-blue-400">{formatCurrency(row.amountCollected)}</span>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    {isEditing ? (
                      <Input 
                        value={row.orNo} 
                        onChange={(e) => onUpdate(row.id, { orNo: e.target.value })}
                        className="w-24"
                      />
                    ) : (
                      <span className="font-mono text-sm">{row.orNo || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input 
                        value={row.paidDate} 
                        onChange={(e) => onUpdate(row.id, { paidDate: e.target.value })}
                        className="w-32"
                      />
                    ) : (
                      <span className="text-sm">{row.paidDate || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(row.id, false)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(row.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(row.id, true)}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onDelete(row.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
