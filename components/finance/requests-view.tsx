'use client'

import * as React from 'react'
import { useMemo, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
// If you want debounce, you can use the existing hook:
// import { useDebounce } from '@/hooks/use-debounce'

type RequestStatus = 'pending' | 'approved' | 'released' | 'rejected' | 'cancelled' | string

type FinanceRequest = {
  id: string
  requestNo: string
  item: string
  amount: number
  approvedBy?: string
  dateReleased?: string | Date | number | null
  status: RequestStatus
}

type SortKey = keyof Pick<FinanceRequest, 'requestNo' | 'item' | 'amount' | 'approvedBy' | 'dateReleased' | 'status'>
type SortDir = 'asc' | 'desc'

const MOCK_DATA: FinanceRequest[] = [
  {
    id: '1',
    requestNo: 'REQ-2025-0001',
    item: 'Printer Toner Cartridge',
    amount: 4500,
    approvedBy: 'Maria Santos',
    dateReleased: '2025-07-12',
    status: 'released',
  },
  {
    id: '2',
    requestNo: 'REQ-2025-0002',
    item: 'Team Lunch Reimbursement',
    amount: 3200,
    approvedBy: 'Juan Dela Cruz',
    dateReleased: null,
    status: 'approved',
  },
  {
    id: '3',
    requestNo: 'REQ-2025-0003',
    item: 'USB-C Docking Station',
    amount: 5600,
    approvedBy: 'Maria Santos',
    dateReleased: '2025-07-15',
    status: 'released',
  },
  {
    id: '4',
    requestNo: 'REQ-2025-0004',
    item: 'Conference Tickets',
    amount: 18000,
    approvedBy: 'A. Villanueva',
    dateReleased: null,
    status: 'pending',
  },
  {
    id: '5',
    requestNo: 'REQ-2025-0005',
    item: 'Mileage Reimbursement',
    amount: 1250.75,
    approvedBy: 'Juan Dela Cruz',
    dateReleased: '2025-07-20',
    status: 'released',
  },
  {
    id: '6',
    requestNo: 'REQ-2025-0006',
    item: 'Office Plants',
    amount: 2400,
    approvedBy: 'Maria Santos',
    dateReleased: null,
    status: 'approved',
  },
  {
    id: '7',
    requestNo: 'REQ-2025-0007',
    item: 'Monitor Arm',
    amount: 2999.99,
    approvedBy: 'A. Villanueva',
    dateReleased: null,
    status: 'rejected',
  },
  {
    id: '8',
    requestNo: 'REQ-2025-0008',
    item: 'Taxi Reimbursement',
    amount: 380,
    approvedBy: 'Maria Santos',
    dateReleased: '2025-07-22',
    status: 'released',
  },
]

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(n)
  } catch {
    return `₱${n.toFixed(2)}`
  }
}

function parseToDate(val: string | Date | number | null | undefined): Date | null {
  if (val == null) return null
  if (val instanceof Date) return val
  if (typeof val === 'number') return new Date(val)
  // string
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function formatDate(val: string | Date | number | null | undefined) {
  const d = parseToDate(val)
  if (!d) return '-'
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const s = status?.toLowerCase()
  const color =
    s === 'released'
      ? 'bg-green-100 text-green-800'
      : s === 'approved'
      ? 'bg-emerald-100 text-emerald-800'
      : s === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : s === 'rejected'
      ? 'bg-red-100 text-red-800'
      : 'bg-slate-100 text-slate-800'
  return <Badge className={cn('capitalize', color)}>{status || 'unknown'}</Badge>
}

export default function RequestsView() {
  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('requestNo')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Filter state
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all')

  // Data state
  const [data, setData] = useState<FinanceRequest[] | null>(null)
  const [loading, setLoading] = useState(true)

  // NOTE: Replace this effect with your real data fetching (e.g., Firestore or API).
  // Example for Firestore (pseudo):
  //   import { db } from '@/lib/firebase'
  //   import { collection, onSnapshot, query as q, orderBy } from 'firebase/firestore'
  //   useEffect(() => {
  //     setLoading(true)
  //     const ref = q(collection(db, 'finance_requests'), orderBy('createdAt', 'desc'))
  //     const unsub = onSnapshot(ref, (snap) => {
  //       const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FinanceRequest[]
  //       setData(rows)
  //       setLoading(false)
  //     })
  //     return () => unsub()
  //   }, [])
  useEffect(() => {
    // Mock simulation
    const t = setTimeout(() => {
      setData(MOCK_DATA)
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredSorted = useMemo(() => {
    const rows = (data ?? []).filter((r) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        [r.requestNo, r.item, r.approvedBy, r.status]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)) ||
        String(r.amount).toLowerCase().includes(q) ||
        formatDate(r.dateReleased).toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'all' ? true : r.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesQuery && matchesStatus
    })

    const sorted = rows.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      let av: any = a[sortKey]
      let bv: any = b[sortKey]

      if (sortKey === 'amount') {
        return (Number(av) - Number(bv)) * dir
      }

      if (sortKey === 'dateReleased') {
        const ad = parseToDate(av)?.getTime() ?? -Infinity
        const bd = parseToDate(bv)?.getTime() ?? -Infinity
        return (ad - bd) * dir
      }

      // string compare
      av = av ?? ''
      bv = bv ?? ''
      return String(av).localeCompare(String(bv)) * dir
    })

    return sorted
  }, [data, query, statusFilter, sortKey, sortDir])

  function resetFilters() {
    setQuery('')
    setStatusFilter('all')
    setSortKey('requestNo')
    setSortDir('asc')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">Finance Requests</CardTitle>
          <p className="text-sm text-muted-foreground">
            Spreadsheet-like view of all requests with sorting and filtering.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full gap-2 sm:max-w-md">
              <Input
                placeholder="Search by Request No., Item, Amount, Approved By, Date, or Status"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search requests"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={resetFilters}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Desktop/tablet: scrollable table */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader
                    label="Request No."
                    onClick={() => toggleSort('requestNo')}
                    active={sortKey === 'requestNo'}
                    dir={sortDir}
                  />
                  <SortableHeader
                    label="Requested Item"
                    onClick={() => toggleSort('item')}
                    active={sortKey === 'item'}
                    dir={sortDir}
                  />
                  <SortableHeader
                    label="Amount"
                    onClick={() => toggleSort('amount')}
                    active={sortKey === 'amount'}
                    dir={sortDir}
                    className="text-right"
                  />
                  <SortableHeader
                    label="Approved By"
                    onClick={() => toggleSort('approvedBy')}
                    active={sortKey === 'approvedBy'}
                    dir={sortDir}
                  />
                  <SortableHeader
                    label="Date Released"
                    onClick={() => toggleSort('dateReleased')}
                    active={sortKey === 'dateReleased'}
                    dir={sortDir}
                  />
                  <SortableHeader
                    label="Status"
                    onClick={() => toggleSort('status')}
                    active={sortKey === 'status'}
                    dir={sortDir}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={`sk-${i}`}>
                        <TableCell colSpan={6}>
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : filteredSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSorted.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap font-medium">{r.requestNo}</TableCell>
                      <TableCell className="min-w-[240px]">{r.item}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(r.amount)}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.approvedBy ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(r.dateReleased)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`msk-${i}`} className="rounded-lg border p-3">
                  <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="mb-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              ))
            ) : filteredSorted.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">No requests found.</p>
            ) : (
              filteredSorted.map((r) => (
                <div key={`m-${r.id}`} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{r.requestNo}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">{r.item}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="tabular-nums">{formatCurrency(r.amount)}</span>
                    <span className="text-muted-foreground">{r.approvedBy ?? '-'}</span>
                    <span className="text-muted-foreground">{formatDate(r.dateReleased)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SortableHeader({
  label,
  onClick,
  active,
  dir,
  className,
}: {
  label: string
  onClick: () => void
  active?: boolean
  dir?: SortDir
  className?: string
}) {
  return (
    <TableHead
      role="columnheader"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('whitespace-nowrap', className)}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={onClick}
        aria-label={`Sort by ${label}`}
      >
        <span className="mr-2">{label}</span>
        <ArrowUpDown className={cn('h-4 w-4', active ? 'opacity-100' : 'opacity-40')} />
      </Button>
    </TableHead>
  )
}
