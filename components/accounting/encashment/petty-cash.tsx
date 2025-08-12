"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Undo2, Search, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, includesAny, parseNumber, sumBy, uid } from "@/components/accounting/utils"

type PettyCashSettings = {
  companyName: string
  pettyCashFundName: string
  pettyCashReplenishment: string
  cutOffPeriod: string
  pettyCashAmount: number
}

type PettyCashRow = {
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

const STORAGE_KEY = "acc_encash_pc_rows_v1"
const STORAGE_KEY_SETTINGS = "acc_encash_pc_settings_v1"

function compute(row: PettyCashRow): PettyCashRow {
  const gross = parseNumber(row.grossAmount)
  const netOfVat = gross / 1.12
  const inputVat = gross - netOfVat
  const onePercent = netOfVat * 0.01
  const twoPercent = netOfVat * 0.02
  const netAmount = gross - onePercent - twoPercent
  return { ...row, netOfVat, inputVat, onePercent, twoPercent, netAmount }
}

const MOCK_SETTINGS: PettyCashSettings = {
  companyName: "OOH Plus Inc.",
  pettyCashFundName: "Petty Cash Fund",
  pettyCashReplenishment: "Dec 2024",
  cutOffPeriod: "Dec 1–31, 2024",
  pettyCashAmount: 50000,
}

const MOCK_ROWS: PettyCashRow[] = [
  compute({
    id: uid("pc"),
    category: "Office Supplies",
    month: "Dec",
    date: "05",
    pettyCashVoucherNo: "PC-001",
    supplierName: "Office Depot",
    description: "Printer paper and pens",
    accountTitle: "Office Supplies",
    documentTypeNo: "OR-2001",
    tinNo: "123-456-789-000",
    companyAddress: "Makati City",
    grossAmount: 5600,
    netOfVat: 0,
    inputVat: 0,
    onePercent: 0,
    twoPercent: 0,
    netAmount: 0,
  }),
  compute({
    id: uid("pc"),
    category: "Transportation",
    month: "Dec",
    date: "08",
    pettyCashVoucherNo: "PC-002",
    supplierName: "Grab Philippines",
    description: "Client meeting transportation",
    accountTitle: "Transportation Expense",
    documentTypeNo: "Receipt-3002",
    tinNo: "987-654-321-000",
    companyAddress: "Taguig City",
    grossAmount: 2240,
    netOfVat: 0,
    inputVat: 0,
    onePercent: 0,
    twoPercent: 0,
    netAmount: 0,
  }),
]

export function PettyCashTable() {
  const { toast } = useToast()
  const [rows, setRows] = useState<PettyCashRow[]>([])
  const [settings, setSettings] = useState<PettyCashSettings>(MOCK_SETTINGS)
  const [query, setQuery] = useState("")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (s) setSettings(JSON.parse(s) as PettyCashSettings)
    } catch {}
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as PettyCashRow[]
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
    const balanceForDeposit = settings.pettyCashAmount - netAmount
    const totalPettyCash = netAmount
    const pcAmountBalance = settings.pettyCashAmount - totalPettyCash
    return {
      gross,
      netOfVat,
      inputVat,
      oneP,
      twoP,
      netAmount,
      balanceForDeposit,
      totalPettyCash,
      pcAmountBalance,
    }
  }, [filtered, rows, settings.pettyCashAmount])

  function addRow() {
    const row = compute({
      id: uid("pc"),
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

  function updateRow(id: string, patch: Partial<PettyCashRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        return compute({ ...r, ...patch })
      }),
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
    toast({ title: "Saved", description: "Petty Cash saved to your browser." })
  }

  function resetMock() {
    setRows(MOCK_ROWS)
    setSettings(MOCK_SETTINGS)
    setDirty(true)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Petty Cash Fund</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your petty cash transactions and balances</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Company Name</label>
              <Input
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={settings.companyName}
                onChange={(e) => {
                  setSettings((s) => ({ ...s, companyName: e.target.value }))
                  setDirty(true)
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fund Name</label>
              <Input
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={settings.pettyCashFundName}
                onChange={(e) => {
                  setSettings((s) => ({ ...s, pettyCashFundName: e.target.value }))
                  setDirty(true)
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Replenishment Period</label>
              <Input
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={settings.pettyCashReplenishment}
                onChange={(e) => {
                  setSettings((s) => ({ ...s, pettyCashReplenishment: e.target.value }))
                  setDirty(true)
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cut-off Period</label>
              <Input
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={settings.cutOffPeriod}
                onChange={(e) => {
                  setSettings((s) => ({ ...s, cutOffPeriod: e.target.value }))
                  setDirty(true)
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fund Amount</label>
              <Input
                type="number"
                inputMode="decimal"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={settings.pettyCashAmount}
                onChange={(e) => {
                  setSettings((s) => ({ ...s, pettyCashAmount: parseNumber(e.target.value) }))
                  setDirty(true)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Button onClick={addRow} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
            <Button
              variant="outline"
              onClick={saveAll}
              disabled={!dirty}
              className="border-gray-300 hover:bg-gray-50 bg-transparent"
            >
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
            <Button variant="outline" onClick={resetMock} className="border-gray-300 hover:bg-gray-50 bg-transparent">
              <Undo2 className="mr-2 h-4 w-4" /> Load Sample Data
            </Button>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-900 py-3 px-4">Category</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">Month</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">Date</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">PCV No.</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">Supplier</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">Description</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">Account</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">Document</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">TIN</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4">Address</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Gross Amount</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Net of VAT</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Input VAT</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">1% Tax</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">2% Tax</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Net Amount</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                >
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.category}
                      onChange={(e) => updateRow(row.id, { category: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.month}
                      onChange={(e) => updateRow(row.id, { month: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, { date: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.pettyCashVoucherNo}
                      onChange={(e) => updateRow(row.id, { pettyCashVoucherNo: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.supplierName}
                      onChange={(e) => updateRow(row.id, { supplierName: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.accountTitle}
                      onChange={(e) => updateRow(row.id, { accountTitle: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.documentTypeNo}
                      onChange={(e) => updateRow(row.id, { documentTypeNo: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.tinNo}
                      onChange={(e) => updateRow(row.id, { tinNo: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Input
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      value={row.companyAddress}
                      onChange={(e) => updateRow(row.id, { companyAddress: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-right"
                      value={row.grossAmount}
                      onChange={(e) => updateRow(row.id, { grossAmount: parseNumber(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(row.netOfVat)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(row.inputVat)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(row.onePercent)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(row.twoPercent)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(row.netAmount)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRow(row.id)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={17} className="text-center text-gray-500 py-8">
                    No transactions found. Try adjusting your search or add a new transaction.
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                <TableCell colSpan={10} className="font-bold text-gray-900 py-4 px-4">
                  TOTALS
                </TableCell>
                <TableCell className="text-right font-bold text-gray-900 py-4 px-4">
                  {formatCurrency(totals.gross)}
                </TableCell>
                <TableCell className="text-right font-bold text-gray-900 py-4 px-4">
                  {formatCurrency(totals.netOfVat)}
                </TableCell>
                <TableCell className="text-right font-bold text-gray-900 py-4 px-4">
                  {formatCurrency(totals.inputVat)}
                </TableCell>
                <TableCell className="text-right font-bold text-gray-900 py-4 px-4">
                  {formatCurrency(totals.oneP)}
                </TableCell>
                <TableCell className="text-right font-bold text-gray-900 py-4 px-4">
                  {formatCurrency(totals.twoP)}
                </TableCell>
                <TableCell className="text-right font-bold text-blue-600 py-4 px-4 text-lg">
                  {formatCurrency(totals.netAmount)}
                </TableCell>
                <TableCell className="py-4 px-4" />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Balance for Deposit</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(totals.balanceForDeposit)}</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
              <div className="h-6 w-6 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Fund Usage</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(totals.totalPettyCash)}</p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <div className="h-6 w-6 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Remaining Balance</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{formatCurrency(totals.pcAmountBalance)}</p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
              <div className="h-6 w-6 bg-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
