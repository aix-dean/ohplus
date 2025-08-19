"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, FileText, DollarSign } from "lucide-react"
import { collection, getDocs, query, where, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

interface TreasuryQuotation {
  id: string
  created: string
  company_id: string
  updated: string
  deleted: boolean
  client_name: string
  quotation_number: string
  amount: number
  currency: string
  status: "draft" | "sent" | "accepted" | "rejected" | "expired"
  valid_until: string
  description: string
  payment_terms: string
  created_by: string
}

export default function TreasuryQuotationsPage() {
  const [quotations, setQuotations] = useState<TreasuryQuotation[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<TreasuryQuotation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchQuotations = async () => {
      if (!user?.company_id && !user?.uid) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const quotationsRef = collection(db, "treasury_quotations")

        // Query quotations for the current user's company
        const q = query(
          quotationsRef,
          where("company_id", "==", user.company_id || user.uid),
          where("deleted", "==", false),
          orderBy("created", "desc"),
        )

        const querySnapshot = await getDocs(q)
        const fetchedQuotations: TreasuryQuotation[] = []

        querySnapshot.forEach((doc) => {
          fetchedQuotations.push({ id: doc.id, ...doc.data() } as TreasuryQuotation)
        })

        setQuotations(fetchedQuotations)
      } catch (error) {
        console.error("Error fetching treasury quotations:", error)
        setQuotations([])
      } finally {
        setLoading(false)
      }
    }

    fetchQuotations()
  }, [user])

  // Filter quotations
  useEffect(() => {
    let filtered = quotations.filter((item) => !item.deleted)

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    setFilteredQuotations(filtered)
  }, [quotations, searchTerm, statusFilter])

  const handleSoftDelete = async (id: string) => {
    try {
      const quotationRef = doc(db, "treasury_quotations", id)
      await updateDoc(quotationRef, {
        deleted: true,
        updated: serverTimestamp(),
      })

      // Update local state
      setQuotations((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted: true, updated: new Date().toISOString().split("T")[0] } : item,
        ),
      )
    } catch (error) {
      console.error("Error soft deleting treasury quotation:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      sent: "outline",
      accepted: "default",
      rejected: "destructive",
      expired: "secondary",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const formatCurrency = (amount: number, currency = "PHP") => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const displayValue = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined || value === "" || (typeof value === "string" && value.trim() === "")) {
      return "-"
    }
    return String(value)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Treasury Quotations</h1>
            <p className="text-muted-foreground">Manage treasury-related quotations and financial proposals</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading treasury quotations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Treasury Quotations</h1>
          <p className="text-muted-foreground">Manage treasury-related quotations and financial proposals</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredQuotations.length}</div>
            <p className="text-xs text-muted-foreground">Active quotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredQuotations.filter((q) => q.status === "sent").reduce((sum, q) => sum + q.amount, 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredQuotations.filter((q) => q.status === "accepted").reduce((sum, q) => sum + q.amount, 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground">Confirmed deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredQuotations.length > 0
                ? Math.round(
                    (filteredQuotations.filter((q) => q.status === "accepted").length / filteredQuotations.length) *
                      100,
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Acceptance rate</p>
          </CardContent>
        </Card>
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
                  placeholder="Search by client name, quotation number, or description..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treasury Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredQuotations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No treasury quotations found</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Quotation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">{displayValue(quotation.quotation_number)}</TableCell>
                      <TableCell>{displayValue(quotation.client_name)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{displayValue(quotation.description)}</TableCell>
                      <TableCell>
                        {quotation.amount ? formatCurrency(quotation.amount, quotation.currency) : "-"}
                      </TableCell>
                      <TableCell>{displayValue(quotation.currency)}</TableCell>
                      <TableCell className="whitespace-nowrap min-w-[100px]">
                        {getStatusBadge(quotation.status)}
                      </TableCell>
                      <TableCell>{displayValue(quotation.valid_until)}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{displayValue(quotation.payment_terms)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSoftDelete(quotation.id)}
                              className="flex items-center text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
