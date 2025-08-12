"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface Collectible {
  id: string
  created: string
  company_id: string
  type: "sites" | "supplies"
  updated: string
  deleted: boolean
  client_name: string
  net_amount: number
  total_amount: number
  mode_of_payment: string
  bank_name: string
  bi_no: string
  or_no: string
  invoice_no: string
  next_collection_date: string
  status: "pending" | "collected" | "overdue"
  // Sites specific fields
  booking_no?: string
  site?: string
  covered_period?: string
  bir_2307?: string
  collection_date?: string
  // Supplies specific fields
  date?: string
  product?: string
  transfer_date?: string
  bs_no?: string
  due_for_collection?: string
  date_paid?: string
  net_amount_collection?: number
}

export default function CollectiblesPage() {
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [filteredCollectibles, setFilteredCollectibles] = useState<Collectible[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  useEffect(() => {
    // TODO: Replace with actual API call to fetch collectibles
    setCollectibles([])
  }, [])

  // Filter collectibles (soft delete - only show deleted: false)
  useEffect(() => {
    let filtered = collectibles.filter((item) => !item.deleted)

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.or_no.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    setFilteredCollectibles(filtered)
  }, [collectibles, searchTerm, statusFilter, typeFilter])

  const handleSoftDelete = (id: string) => {
    setCollectibles((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, deleted: true, updated: new Date().toISOString().split("T")[0] } : item,
      ),
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      collected: "default",
      overdue: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Collectibles</h1>
          <p className="text-muted-foreground">Manage your collection records and track payments</p>
        </div>
        <Link href="/finance/collectibles/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Collectible
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name, invoice no, or OR no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sites">Sites</SelectItem>
                <SelectItem value="supplies">Supplies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collectibles Records</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCollectibles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No collectibles found</p>
              <Link href="/finance/collectibles/create">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Collectible
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>OR No</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Collection</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollectibles.map((collectible) => (
                    <TableRow key={collectible.id}>
                      <TableCell className="font-medium">{collectible.client_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{collectible.type}</Badge>
                      </TableCell>
                      <TableCell>{collectible.invoice_no}</TableCell>
                      <TableCell>{collectible.or_no}</TableCell>
                      <TableCell>{formatCurrency(collectible.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(collectible.status)}</TableCell>
                      <TableCell>{collectible.next_collection_date}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/finance/collectibles/edit/${collectible.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleSoftDelete(collectible.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
