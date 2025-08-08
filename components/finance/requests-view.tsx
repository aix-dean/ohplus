'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import type { FinanceRequest } from '@/lib/types/finance-request';

type SortDirection = 'asc' | 'desc';
type SortColumn =
  | 'requestNo'
  | 'requestedItem'
  | 'amount'
  | 'approvedBy'
  | 'dateReleased'
  | 'status';

const currencies = [
  { code: 'PHP', symbol: '₱' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: '¥' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'KRW', symbol: '₩' },
  { code: 'THB', symbol: '฿' },
  { code: 'MYR', symbol: 'RM' },
  { code: 'IDR', symbol: 'Rp' },
  { code: 'VND', symbol: '₫' },
];

const STATUS_OPTIONS = ['All', 'Approved', 'Pending', 'Rejected', 'Processing'] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

function getCurrencySymbol(code?: string) {
  if (!code) return '';
  const c = currencies.find((c) => c.code === code);
  return c?.symbol ?? '';
}

function formatAmount(amount: number, currencyCode: string) {
  const symbol = getCurrencySymbol(currencyCode) || '';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusBadgeVariant(status: string) {
  switch (status?.toLowerCase?.()) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    case 'processing':
      return 'outline';
    default:
      return 'secondary';
  }
}

export default function RequestsView() {
  const { user, userData } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<FinanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('requestNo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch Firestore "request" docs for the user's company
  useEffect(() => {
    const companyIdentifier = user?.company_id || userData?.project_id || user?.uid;

    if (!companyIdentifier) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'request'),
      where('company_id', '==', companyIdentifier),
      where('deleted', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const list: FinanceRequest[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({ id: docSnap.id, ...data } as FinanceRequest);
        });

        // Default sort newest by "Request No." if available, else by created
        list.sort((a, b) => {
          const aNo = Number(a['Request No.'] ?? 0);
          const bNo = Number(b['Request No.'] ?? 0);
          if (aNo && bNo) return bNo - aNo;
          const aTime = a.created?.toDate?.()?.getTime?.() ?? 0;
          const bTime = b.created?.toDate?.()?.getTime?.() ?? 0;
          return bTime - aTime;
        });

        setRequests(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch requests. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userData, toast]);

  // Helpers to extract values
  const getDateReleasedMs = useCallback((r: FinanceRequest) => {
    // Only reimbursement has 'Date Released'
    // If missing, return 0 so it sorts last when ascending
    // For display we will show '—'
    // Firestore Timestamp has toDate()
    // @ts-ignore - narrow at runtime
    const ts = r['Date Released'];
    const d = ts?.toDate?.();
    return d ? d.getTime() : 0;
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return requests.filter((r) => {
      // Status filter
      const status = (r.Actions || '').toString();
      const statusMatch =
        statusFilter === 'All' ? true : status.toLowerCase() === statusFilter.toLowerCase();

      if (!q) return statusMatch;

      // Search across the requested columns
      const requestNo = String(r['Request No.'] ?? '').toLowerCase();
      const item = String(r['Requested Item'] ?? '').toLowerCase();
      const approvedBy = String(r['Approved By'] ?? '').toLowerCase();
      const amountStr = String(r.Amount ?? '');
      const statusStr = String(r.Actions ?? '').toLowerCase();
      const dateReleasedStr = (() => {
        const ms = getDateReleasedMs(r);
        return ms ? format(new Date(ms), 'MMM dd, yyyy').toLowerCase() : '';
      })();

      const haystack = [
        requestNo,
        item,
        approvedBy,
        amountStr,
        statusStr,
        dateReleasedStr,
      ];

      return statusMatch && haystack.some((s) => s.includes(q));
    });
  }, [requests, searchQuery, statusFilter, getDateReleasedMs]);

  const sorted = useMemo(() => {
    const arr = [...filtered];

    const compareStrings = (a?: string, b?: string) =>
      (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });

    arr.sort((a, b) => {
      let res = 0;

      switch (sortColumn) {
        case 'requestNo': {
          const aNo = Number(a['Request No.'] ?? 0);
          const bNo = Number(b['Request No.'] ?? 0);
          res = aNo - bNo;
          break;
        }
        case 'requestedItem': {
          res = compareStrings(a['Requested Item'], b['Requested Item']);
          break;
        }
        case 'amount': {
          const aAmt = Number(a.Amount ?? 0);
          const bAmt = Number(b.Amount ?? 0);
          res = aAmt - bAmt;
          break;
        }
        case 'approvedBy': {
          res = compareStrings(a['Approved By'], b['Approved By']);
          break;
        }
        case 'dateReleased': {
          const aMs = getDateReleasedMs(a);
          const bMs = getDateReleasedMs(b);
          res = aMs - bMs;
          break;
        }
        case 'status': {
          res = compareStrings(a.Actions, b.Actions);
          break;
        }
        default:
          res = 0;
      }

      return sortDirection === 'asc' ? res : -res;
    });

    return arr;
  }, [filtered, sortColumn, sortDirection, getDateReleasedMs]);

  const toggleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      // Default direction per column
      setSortDirection(col === 'requestNo' || col === 'amount' || col === 'dateReleased' ? 'desc' : 'asc');
    }
  };

  const clearSearch = () => setSearchQuery('');
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setSortColumn('requestNo');
    setSortDirection('desc');
  };

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
          </div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="h-10 bg-muted rounded w-full animate-pulse" />
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-40 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Requests</h1>
          <p className="text-muted-foreground">Spreadsheet view of requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearFilters}>Reset</Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative md:max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Request No., Item, Amount, Approved By, Status, or Date Released"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              aria-label="Clear search"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="sticky top-0 bg-background z-10">
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('requestNo')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Request No.'}
                      <SortIcon col="requestNo" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('requestedItem')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Requested Item'}
                      <SortIcon col="requestedItem" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('amount')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Amount'}
                      <SortIcon col="amount" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('approvedBy')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Approved By'}
                      <SortIcon col="approvedBy" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('dateReleased')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Date Released'}
                      <SortIcon col="dateReleased" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('status')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Status'}
                      <SortIcon col="status" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => {
                  const dateMs = (() => {
                    // @ts-ignore
                    const ts = r['Date Released'];
                    const d = ts?.toDate?.();
                    return d ? d.getTime() : 0;
                  })();
                  const dateStr = dateMs ? format(new Date(dateMs), 'MMM dd, yyyy') : '—';

                  return (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium tabular-nums">
                        #{r['Request No.'] ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate">
                        {r['Requested Item'] ?? '—'}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {formatAmount(Number(r.Amount ?? 0), r.Currency ?? 'PHP')}
                      </TableCell>
                      <TableCell>{r['Approved By'] || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dateStr}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(r.Actions)}>{r.Actions || '—'}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No requests found. Adjust filters or search terms.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Responsive hint for small screens */}
      <p className="text-xs text-muted-foreground">
        Tip: On mobile, scroll the table horizontally to see all columns.
      </p>
    </div>
  );
}
