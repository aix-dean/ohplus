'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FinanceRequest } from '@/lib/types/finance-request'
import { Search, Filter, MoreHorizontal, Eye, Download, Calendar, DollarSign, FileText, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<FinanceRequest[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<FinanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  // Fetch approved expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user?.company_id) return

      try {
        setLoading(true)
        const expensesRef = collection(db, 'finance_requests')
        const q = query(
          expensesRef,
          where('company_id', '==', user.company_id),
          where('deleted', '==', false),
          where('status', '==', 'approved'),
          orderBy('created', 'desc')
        )

        const querySnapshot = await getDocs(q)
        const expensesData: FinanceRequest[] = []

        querySnapshot.forEach((doc) => {
          expensesData.push({ id: doc.id, ...doc.data() } as FinanceRequest)
        })

        setExpenses(expensesData)
        setFilteredExpenses(expensesData)
      } catch (error) {
        console.error('Error fetching expenses:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch expenses. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [user?.company_id, toast])

  // Filter expenses based on search and filters
  useEffect(() => {
    let filtered = expenses

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.Requestor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense['Requested Item'].toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense['Request No.'].toString().includes(searchTerm)
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((expense) => expense.request_type === typeFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((expense) => {
            const expenseDate = expense.created.toDate()
            return expenseDate >= filterDate
          })
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((expense) => {
            const expenseDate = expense.created.toDate()
            return expenseDate >= filterDate
          })
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((expense) => {
            const expenseDate = expense.created.toDate()
            return expenseDate >= filterDate
          })
          break
      }
    }

    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, typeFilter, dateFilter])

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.Amount, 0)
  const reimbursementTotal = filteredExpenses
    .filter((expense) => expense.request_type === 'reimbursement')
    .reduce((sum, expense) => sum + expense.Amount, 0)
  const requisitionTotal = filteredExpenses
    .filter((expense) => expense.request_type === 'requisition')
    .reduce((sum, expense) => sum + expense.Amount, 0)

  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    const currencySymbols: { [key: string]: string } = {
      PHP: '₱',
      USD: '$',
      EUR: '€',
      GBP: '£',
    }
    const symbol = currencySymbols[currency] || currency
    return `${symbol}${amount.toLocaleString()}`
  }

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRequestTypeIcon = (type: string) => {
    return type === 'reimbursement' ? <DollarSign className="h-4 w-4" /> : <FileText className="h-4 w-4" />
  }

  const getRequestTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'reimbursement' ? 'default' : 'secondary'} className="capitalize">
        {getRequestTypeIcon(type)}
        <span className="ml-1">{type}</span>
      </Badge>
    )
  }

  const handleViewDetails = (expenseId: string) => {
    router.push(`/finance/requests/details/${expenseId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">View approved finance requests and expenses</p>
          </div>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Table */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">View approved finance requests and expenses</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} approved requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reimbursements</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reimbursementTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.filter((e) => e.request_type === 'reimbursement').length} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisitions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(requisitionTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.filter((e) => e.request_type === 'requisition').length} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredExpenses
                  .filter((expense) => {
                    const expenseDate = expense.created.toDate()
                    const now = new Date()
                    return (
                      expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
                    )
                  })
                  .reduce((sum, expense) => sum + expense.Amount, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Current month total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Expenses</CardTitle>
          <CardDescription>All approved finance requests for your company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by requestor, item, or request number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reimbursement">Reimbursement</SelectItem>
                <SelectItem value="requisition">Requisition</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expenses Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requestor</TableHead>
                  <TableHead>Requested Item</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No approved expenses found</p>
                        {searchTerm || typeFilter !== 'all' || dateFilter !== 'all' ? (
                          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">#{expense['Request No.']}</TableCell>
                      <TableCell>{getRequestTypeBadge(expense.request_type)}</TableCell>
                      <TableCell>{expense.Requestor}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={expense['Requested Item']}>
                        {expense['Requested Item']}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(expense.Amount, expense.Currency)}
                      </TableCell>
                      <TableCell>{expense['Approved By']}</TableCell>
                      <TableCell>{formatDate(expense.created)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(expense.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
