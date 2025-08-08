"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Undo2, Search, Trash2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, includesAny, parseNumber, sumBy, uid } from "../utils"

type RevolvingSettings = {
  companyName: string
  revolvingFundName: string
  revolvingFundReplenishment: string
  cutOffPeriod: string
  revolvingFundAmount: number
}

type RevolvingRow = {
  id: string
  category: string
  month: string
  date: string
  pettyCashVoucherNo: string
  supplierName: string
  description: string
  accountTitle: string
  documentTypeNo: string
  tinNo: string
  companyAddress: string
  grossAmount: number
  // computed
  netOfVat: number
  inputVat: number
  onePercent: number
  twoPercent: number
  netAmount: number
}

const STORAGE_KEY = "acc_encash_rvf_rows_v1"
const STORAGE_KEY_SETTINGS = "acc_encash_rvf_settings_v1"

function compute(row: RevolvingRow): RevolvingRow {
  const gross = parseNumber(row.grossAmount)
  const netOfVat = gross / 1.12
  const inputVat = gross - netOfVat
  const onePercent = netOfVat * 0.01
  const twoPercent = netOfVat * 0.02
  const netAmount = gross - onePercent - twoPercent
  return { ...row, netOfVat, inputVat, onePercent, twoPercent, netAmount }
}

const MOCK_SETTINGS: RevolvingSettings = {
  companyName: "OOH Plus Inc.",
  revolvingFundName: "Revolving Fund",
  revolvingFundReplenishment: "Dec 2024",
  cutOffPeriod: "Dec 1–31, 2024",
  revolvingFundAmount: 350000,
}

const MOCK_ROWS: RevolvingRow[] = [
  compute({
    id: uid("rvf"),
    category: "Repairs",
    month: "Dec",
    date: "09",
    pettyCashVoucherNo: "RVF-001",
    supplierName: "FixIt Co",
    description: "LED panel repairs",
    accountTitle: "Repairs and Maintenance",
    documentTypeNo: "SI-3001",
    tinNo: "333-444-555-000",
    companyAddress: "Quezon City",
    grossAmount: 33600,
    netOfVat: 0,
    inputVat: 0,
    onePercent: 0,
    twoPercent: 0,
    netAmount: 0,
  }),
]

export function RevolvingFundTable() {
  const { toast } = useToast()
  const [rows, setRows] = useState<RevolvingRow[]>([])
  const [settings, setSettings] = useState<RevolvingSettings>(MOCK_SETTINGS)
  const [query, setQuery] = useState("")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (s) setSettings(JSON.parse(s) as RevolvingSettings)
    } catch {}
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as RevolvingRow[]
        setRows(parsed.map(compute))
        return
      }
    } catch {}
    setRows(MOCK_ROWS)
  }, [])

  const filtered = useMemo(() => rows.filter((r) => includesAny(r, query)), [rows, query])

  const totals = useMemo(() => {
    const base = filtered.length ? filtered : rows
    const gross = sumBy(base, (r) => r.grossAmount)
    const netOfVat = sumBy(base, (r) => r.netOfVat)
    const inputVat = sumBy(base, (r) => r.inputVat)
    const oneP = sumBy(base, (r) => r.onePercent)
    const twoP = sumBy(base, (r) => r.twoPercent)
    const netAmount = sumBy(base, (r) => r.netAmount)
    const balanceForDeposit = settings.revolvingFundAmount - netAmount
    const totalRevolvingFund = netAmount - balanceForDeposit
    const rvfAmountBalance = settings.revolvingFundAmount - totalRevolvingFund
    return {
      gross,
      netOfVat,
      inputVat,
      oneP,
      twoP,
      netAmount,
      balanceForDeposit,
      totalRevolvingFund,
      rvfAmountBalance,
    }
  }, [filtered, rows, settings.revolvingFundAmount])

  function addRow() {
    const row = compute({
      id: uid("rvf"),
      category: "",
      month: "",
      date: "",
      pettyCashVoucherNo: "",
      supplierName: "",
      description: "",
      accountTitle: "",
      documentTypeNo: "",
      tinNo: "",
      companyAddress: "",
      grossAmount: 0,
      netOfVat: 0,
      inputVat: 0,
      onePercent: 0,
      twoPercent: 0,
      netAmount: 0,
    })
    setRows((r) => [row, ...r])
    setDirty(true)
  }

  function updateRow(id: string, patch: Partial<RevolvingRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        return compute({ ...r, ...patch })
      })
    )
    setDirty(true)
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
    setDirty(true)
  }

  function saveAll() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
    setDirty(false)
    toast({ title: "Saved", description: "Revolving Fund saved to your browser." })
  }

  function resetMock() {
    setRows(MOCK_ROWS)
    setSettings(MOCK_SETTINGS)
    setDirty(true)
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Revolving Fund</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <Input
            placeholder="Company Name"
            value={settings.companyName}
            onChange={(e) => {
              setSettings((s) => ({ ...s, companyName: e.target.value }))
              setDirty(true)
            }}
          />
          <Input
            placeholder="Revolving Fund"
            value={settings.revolvingFundName}
            onChange={(e) => {
              setSettings((s) => ({ ...s, revolvingFundName: e.target.value }))
              setDirty(true)
            }}
          />
          <Input
            placeholder="RVF Replenishment"
            value={settings.revolvingFundReplenishment}
            onChange={(e) => {
              setSettings((s) => ({ ...s, revolvingFundReplenishment: e.target.value }))
              setDirty(true)
            }}
          />
          <Input
            placeholder="Cut-off Period"
            value={settings.cutOffPeriod}
            onChange={(e) => {
              setSettings((s) => ({ ...s, cutOffPeriod: e.target.value }))
              setDirty(true)
            }}
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Amount"
            value={settings.revolvingFundAmount}
            onChange={(e) => {
              setSettings((s) => ({ ...s, revolvingFundAmount: parseNumber(e.target.value) }))
              setDirty(true)
            }}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button onClick={addRow} className="bg-[#16a34a] hover:bg-[#15803d] text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Row
            </Button>
            <Button variant="outline" onClick={saveAll} disabled={!dirty}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button variant="outline" onClick={resetMock}>
              <Undo2 className="mr-2 h-4 w-4" /> Load Mock Data
            </Button>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search any field..." className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>PCV No.</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account Title</TableHead>
                <TableHead>Doc Type/No.</TableHead>
                <TableHead>TIN No.</TableHead>
                <TableHead>Company Address</TableHead>
                <TableHead className="text-right">Gross Amount</TableHead>
                <TableHead className="text-right">Net of VAT</TableHead>
                <TableHead className="text-right">Input VAT</TableHead>
                <TableHead className="text-right">1%</TableHead>
                <TableHead className="text-right">2%</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="min-w-[10rem]">
                    <Input value={row.category} onChange={(e) => updateRow(row.id, { category: e.target.value })} />
                  </TableCell>
                  <TableCell className="min-w-[6rem]">
                    <Input value={row.month} onChange={(e) => updateRow(row.id, { month: e.target.value })} />
                  </TableCell>
                  <TableCell className="min-w-[6rem]">
                    <Input value={row.date} onChange={(e) => updateRow(row.id, { date: e.target.value })} />
                  </TableCell>
                  <TableCell className="min-w-[8rem]">
                    <Input
                      value={row.pettyCashVoucherNo}
                      onChange={(e) => updateRow(row.id, { pettyCashVoucherNo: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="min-w-[12rem]">
                    <Input
                      value={row.supplierName}
                      onChange={(e) => updateRow(row.id, { supplierName: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="min-w-[16rem]">
                    <Input value={row.description} onChange={(e) => updateRow(row.id, { description: e.target.value })} />
                  </TableCell>
                  <TableCell className="min-w-[12rem]">
                    <Input
                      value={row.accountTitle}
                      onChange={(e) => updateRow(row.id, { accountTitle: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="min-w-[12rem]">
                    <Input
                      value={row.documentTypeNo}
                      onChange={(e) => updateRow(row.id, { documentTypeNo: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="min-w-[12rem]">
                    <Input value={row.tinNo} onChange={(e) => updateRow(row.id, { tinNo: e.target.value })} />
                  </TableCell>
                  <TableCell className="min-w-[16rem]">
                    <Input
                      value={row.companyAddress}
                      onChange={(e) => updateRow(row.id, { companyAddress: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-right min-w-[10rem]">
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="text-right"
                      value={row.grossAmount}
                      onChange={(e) => updateRow(row.id, { grossAmount: parseNumber(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.netOfVat)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.inputVat)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.onePercent)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.twoPercent)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.netAmount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteRow(row.id)} aria-label="Delete row">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={17} className="text-center text-muted-foreground">
                    No rows. Try clearing the search or add a new row.
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={10} className="font-medium">
                  Totals
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.gross)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.netOfVat)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.inputVat)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.oneP)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.twoP)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.netAmount)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balance for Deposit</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatCurrency(totals.balanceForDeposit)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Revolving Fund</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatCurrency(totals.totalRevolvingFund)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RVF Amount Balance</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatCurrency(totals.rvfAmountBalance)}</CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
