"use client"

import { Label } from "@/components/ui/label"

// Export as named export PettyCashFundTable instead of default export
export { PettyCashFundTable }

import type React from "react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "your-dialog-library"
import {
  Button,
  Checkbox,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "your-ui-library"

interface Transaction {
  id: string
  category: string
  month: string
  date: string
  pcvNo: string
  supplier: string
  description: string
  account: string
  document: string
  tin: string
  address: string
  grossAmount: number
  netOfVat: number
  inputVat: number
  onePercent: number
  twoPercent: number
  netAmount: number
  type: "PETTYCASH"
}

const parseNumber = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "number") return isNaN(value) ? 0 : value
  if (typeof value === "string") {
    const cleaned = value.replace(/[₱,\s]/g, "")
    const parsed = Number.parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

const sumBy = (array: Transaction[], key: keyof Transaction): number => {
  return array.reduce((sum, item) => sum + parseNumber(item[key]), 0)
}

function PettyCashFundTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settings, setSettings] = useState<{ fundAmount: string }>({ fundAmount: "" })
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const calculateTotals = useMemo(() => {
    const totalGrossAmount = sumBy(transactions, "grossAmount")
    const totalNetOfVat = sumBy(transactions, "netOfVat")
    const totalInputVat = sumBy(transactions, "inputVat")
    const totalOnePercent = sumBy(transactions, "onePercent")
    const totalTwoPercent = sumBy(transactions, "twoPercent")
    const totalNetAmount = sumBy(transactions, "netAmount")

    const fundAmount = parseNumber(settings.fundAmount)
    const balanceForDeposit = fundAmount - totalNetAmount
    const totalPettyCashFund = totalNetAmount - balanceForDeposit
    const pcfAmountBalance = fundAmount - totalPettyCashFund

    return {
      totalGrossAmount,
      totalNetOfVat,
      totalInputVat,
      totalOnePercent,
      totalTwoPercent,
      totalNetAmount,
      balanceForDeposit,
      totalPettyCashFund,
      pcfAmountBalance,
    }
  }, [transactions, settings.fundAmount])

  const [formData, setFormData] = useState<Omit<Transaction, "id" | "type">>({
    category: "",
    month: "",
    date: "",
    pcvNo: "",
    supplier: "",
    description: "",
    account: "",
    document: "",
    tin: "",
    address: "",
    grossAmount: 0,
    netOfVat: 0,
    inputVat: 0,
    onePercent: 0,
    twoPercent: 0,
    netAmount: 0,
  })

  const handleGrossAmountChange = (value: string) => {
    const grossAmount = parseNumber(value)
    const netOfVat = grossAmount / 1.12
    const inputVat = netOfVat * 0.12
    const onePercent = netOfVat * 0.01
    const twoPercent = netOfVat * 0.02
    const netAmount = grossAmount - onePercent - twoPercent

    setFormData((prev) => ({
      ...prev,
      grossAmount,
      netOfVat,
      inputVat,
      onePercent,
      twoPercent,
      netAmount,
    }))
  }

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    // Logic to add transaction
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedTransactions(checked ? transactions.map((t) => t.id) : [])
  }

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions((prev) => (checked) => (checked ? [...prev, id] : prev.filter((tid) => tid !== id)))
  }

  return (
    <div>
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  value={formData.month}
                  onChange={(e) => setFormData((prev) => ({ ...prev, month: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pcvNo">PCV No.</Label>
                <Input
                  id="pcvNo"
                  value={formData.pcvNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pcvNo: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account">Account</Label>
                <Input
                  id="account"
                  value={formData.account}
                  onChange={(e) => setFormData((prev) => ({ ...prev, account: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">Document</Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => setFormData((prev) => ({ ...prev, document: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  value={formData.tin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tin: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grossAmount">Gross Amount</Label>
                  <Input
                    id="grossAmount"
                    type="number"
                    step="0.01"
                    value={formData.grossAmount}
                    onChange={(e) => handleGrossAmountChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netOfVat">Net of VAT</Label>
                  <Input
                    id="netOfVat"
                    type="number"
                    step="0.01"
                    value={formData.netOfVat.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inputVat">Input VAT</Label>
                  <Input
                    id="inputVat"
                    type="number"
                    step="0.01"
                    value={formData.inputVat.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onePercent">1%</Label>
                  <Input
                    id="onePercent"
                    type="number"
                    step="0.01"
                    value={formData.onePercent.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twoPercent">2%</Label>
                  <Input
                    id="twoPercent"
                    type="number"
                    step="0.01"
                    value={formData.twoPercent.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netAmount">Net Amount</Label>
                  <Input
                    id="netAmount"
                    type="number"
                    step="0.01"
                    value={formData.netAmount.toFixed(2)}
                    readOnly
                    className="bg-gray-50 font-semibold"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTransactionModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Transaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedTransactions.length === transactions.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>PCV No.</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>TIN</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Gross Amount</TableHead>
            <TableHead className="text-right">Net of VAT</TableHead>
            <TableHead className="text-right">Input VAT</TableHead>
            <TableHead className="text-right">1%</TableHead>
            <TableHead className="text-right">2%</TableHead>
            <TableHead className="text-right">Net Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Checkbox
                  checked={selectedTransactions.includes(transaction.id)}
                  onCheckedChange={() => handleSelectTransaction(transaction.id)}
                />
              </TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell>{transaction.month}</TableCell>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{transaction.pcvNo}</TableCell>
              <TableCell>{transaction.supplier}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>{transaction.account}</TableCell>
              <TableCell>{transaction.document}</TableCell>
              <TableCell>{transaction.tin}</TableCell>
              <TableCell>{transaction.address}</TableCell>
              <TableCell className="text-right">₱{transaction.grossAmount.toFixed(2)}</TableCell>
              <TableCell className="text-right">₱{transaction.netOfVat.toFixed(2)}</TableCell>
              <TableCell className="text-right">₱{transaction.inputVat.toFixed(2)}</TableCell>
              <TableCell className="text-right">₱{transaction.onePercent.toFixed(2)}</TableCell>
              <TableCell className="text-right">₱{transaction.twoPercent.toFixed(2)}</TableCell>
              <TableCell className="text-right font-semibold">₱{transaction.netAmount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-gray-50 font-semibold">
            <TableCell colSpan={11}>TOTALS</TableCell>
            <TableCell className="text-right">₱{calculateTotals.totalGrossAmount.toFixed(2)}</TableCell>
            <TableCell className="text-right">₱{calculateTotals.totalNetOfVat.toFixed(2)}</TableCell>
            <TableCell className="text-right">₱{calculateTotals.totalInputVat.toFixed(2)}</TableCell>
            <TableCell className="text-right">₱{calculateTotals.totalOnePercent.toFixed(2)}</TableCell>
            <TableCell className="text-right">₱{calculateTotals.totalTwoPercent.toFixed(2)}</TableCell>
            <TableCell className="text-right">₱{calculateTotals.totalNetAmount.toFixed(2)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
