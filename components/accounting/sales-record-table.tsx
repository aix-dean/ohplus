"use client"

import { useEffect, useMemo, useState } from "react"
import { uid, parseNumber, sumBy, includesAny, formatCurrency } from "./utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Undo2, Search, Trash2, PencilLine, Check, X } from 'lucide-react'
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
  const amountCollected = total - creditableTax // Invoice Amount assumed = Total (per spec)
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
    toast({ title: "Saved", description: "Sales Record saved to your browser." })
  }

  function resetToMock() {
    setRows(MOCK_ROWS.map(recompute))
    setDirty(true)
    setEditing({})
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
  }

  function toggleEdit(id: string, state?: boolean) {
    setEditing((prev) => ({ ...prev, [id]: state ?? !prev[id] }))
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Sales Record</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button onClick={addRow} className="bg-[#16a34a] hover:bg-[#15803d] text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Row
            </Button>
            <Button variant="outline" onClick={save} disabled={!dirty}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button variant="outline" onClick={resetToMock}>
              <Undo2 className="mr-2 h-4 w-4" /> Load Mock Data
            </Button>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search any field..."
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search rows"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mobile list (stacked cards) */}
        <div className="space-y-3 md:hidden">
          {filtered.map((row) => {
            const isEditing = !!editing[row.id]
            return (
              <div key={row.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{row.clients || "New Client"}</div>
                  <div className="flex gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Done editing"
                          onClick={() => toggleEdit(row.id, false)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Cancel editing"
                          onClick={() => toggleEdit(row.id, false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit row"
                        onClick={() => toggleEdit(row.id, true)}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" aria-label="Delete row" onClick={() => deleteRow(row.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Field
                    label="Month"
                    value={row.month}
                    editing={isEditing}
                    onChange={(v) => updateRow(row.id, { month: v })}
                  />
                  <Field label="Date" value={row.date} editing={isEditing} onChange={(v) => updateRow(row.id, { date: v })} />
                  <Field
                    label="Service Invoice"
                    value={row.serviceInvoice}
                    editing={isEditing}
                    onChange={(v) => updateRow(row.id, { serviceInvoice: v })}
                  />
                  <Field label="BS #" value={row.bsNumber} editing={isEditing} onChange={(v) => updateRow(row.id, { bsNumber: v })} />
                  <Field label="Clients" value={row.clients} editing={isEditing} onChange={(v) => updateRow(row.id, { clients: v })} />
                  <Field label="TIN" value={row.tin} editing={isEditing} onChange={(v) => updateRow(row.id, { tin: v })} />
                  <Field
                    label="Description"
                    value={row.description}
                    editing={isEditing}
                    onChange={(v) => updateRow(row.id, { description: v })}
                  />
                  <Field
                    label="Net Sales"
                    value={String(row.netSales)}
                    editing={isEditing}
                    numeric
                    onChange={(v) => updateRow(row.id, { netSales: parseNumber(v) })}
                  />
                  <ReadField label="Output VAT" value={formatCurrency(row.outputVat)} />
                  <ReadField label="Total" value={formatCurrency(row.total)} />
                  <ReadField label="Discount" value={formatCurrency(row.discount)} />
                  <ReadField label="Creditable Tax" value={formatCurrency(row.creditableTax)} />
                  <ReadField label="Amount Collected" value={formatCurrency(row.amountCollected)} />
                  <Field label="OR No." value={row.orNo} editing={isEditing} onChange={(v) => updateRow(row.id, { orNo: v })} />
                  <Field
                    label="Paid/Deposit Date"
                    value={row.paidDate}
                    editing={isEditing}
                    onChange={(v) => updateRow(row.id, { paidDate: v })}
                  />
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="rounded-md border p-4 text-center text-muted-foreground">No rows match the search.</div>
          )}

          {/* Mobile totals */}
          <div className="rounded-lg border p-3">
            <div className="font-medium mb-2">Totals</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Net Sales</div>
              <div className="text-right font-medium">{formatCurrency(totals.netSales)}</div>
              <div className="text-muted-foreground">Output VAT</div>
              <div className="text-right font-medium">{formatCurrency(totals.outputVat)}</div>
              <div className="text-muted-foreground">Total</div>
              <div className="text-right font-medium">{formatCurrency(totals.total)}</div>
              <div className="text-muted-foreground">Creditable Tax</div>
              <div className="text-right font-medium">{formatCurrency(totals.creditableTax)}</div>
              <div className="text-muted-foreground">Amount Collected</div>
              <div className="text-right font-medium">{formatCurrency(totals.amountCollected)}</div>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[5rem]">Month</TableHead>
                <TableHead className="min-w-[5rem]">Date</TableHead>
                <TableHead className="min-w-[8rem]">Service Invoice</TableHead>
                <TableHead className="min-w-[8rem]">BS #</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>TIN</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right min-w-[10rem]">Net Sales</TableHead>
                <TableHead className="text-right min-w-[8rem]">Output VAT</TableHead>
                <TableHead className="text-right min-w-[8rem]">Total</TableHead>
                <TableHead className="text-right min-w-[8rem]">Discount</TableHead>
                <TableHead className="text-right min-w-[8rem]">Creditable Tax</TableHead>
                <TableHead className="text-right min-w-[8rem]">Amount Collected</TableHead>
                <TableHead className="min-w-[8rem]">OR No.</TableHead>
                <TableHead className="min-w-[8rem]">Paid/Deposit Date</TableHead>
                <TableHead className="text-right min-w-[6rem]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const isEditing = !!editing[row.id]
                return (
                  <TableRow key={row.id} className={isEditing ? "bg-muted/30" : ""}>
                    <TableCell>
                      {isEditing ? (
                        <Input value={row.month} onChange={(e) => updateRow(row.id, { month: e.target.value })} />
                      ) : (
                        <span>{row.month || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={row.date} onChange={(e) => updateRow(row.id, { date: e.target.value })} />
                      ) : (
                        <span>{row.date || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={row.serviceInvoice}
                          onChange={(e) => updateRow(row.id, { serviceInvoice: e.target.value })}
                        />
                      ) : (
                        <span>{row.serviceInvoice || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={row.bsNumber} onChange={(e) => updateRow(row.id, { bsNumber: e.target.value })} />
                      ) : (
                        <span>{row.bsNumber || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={row.clients} onChange={(e) => updateRow(row.id, { clients: e.target.value })} />
                      ) : (
                        <span>{row.clients || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={row.tin} onChange={(e) => updateRow(row.id, { tin: e.target.value })} />
                      ) : (
                        <span>{row.tin || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={row.description}
                          onChange={(e) => updateRow(row.id, { description: e.target.value })}
                        />
                      ) : (
                        <span>{row.description || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          inputMode="decimal"
                          className="text-right"
                          value={row.netSales}
                          onChange={(e) => updateRow(row.id, { netSales: parseNumber(e.target.value) })}
                        />
                      ) : (
                        <span className="tabular-nums">{formatCurrency(row.netSales)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.outputVat)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.total)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.discount)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.creditableTax)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.amountCollected)}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={row.orNo} onChange={(e) => updateRow(row.id, { orNo: e.target.value })} />
                      ) : (
                        <span>{row.orNo || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={row.paidDate} onChange={(e) => updateRow(row.id, { paidDate: e.target.value })} />
                      ) : (
                        <span>{row.paidDate || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Done editing"
                              onClick={() => toggleEdit(row.id, false)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Cancel editing"
                              onClick={() => toggleEdit(row.id, false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit row"
                            onClick={() => toggleEdit(row.id, true)}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" aria-label="Delete row" onClick={() => deleteRow(row.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-muted-foreground">
                    No rows. Try clearing the search or add a new row.
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={7} className="font-medium">
                  Totals
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.netSales)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.outputVat)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.total)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(0)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.creditableTax)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.amountCollected)}</TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
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
    <div className="grid grid-cols-1 gap-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      {editing ? (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          inputMode={numeric ? "decimal" : "text"}
          type={numeric ? "number" : "text"}
        />
      ) : (
        <div className="text-sm">{value || "-"}</div>
      )}
    </div>
  )
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm tabular-nums">{value}</div>
    </div>
  )
}
