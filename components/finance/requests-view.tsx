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
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { FinanceRequest } from '@/lib/types/finance-request';

type SortDirection = 'asc' | 'desc';
type SortColumn =
  | 'requestNo'
  | 'type'
  | 'requestedItem'
  | 'amount'
  | 'approvedBy'
  | 'date'
  | 'cashback'
  | 'orNo'
  | 'invoiceNo'
  | 'quotation'
  | 'status';

const STATUS_OPTIONS = ['All', 'Approved', 'Pending', 'Rejected', 'Processing'] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

const TYPE_OPTIONS = ['All', 'reimbursement', 'requisition'] as const;
type TypeFilter = typeof TYPE_OPTIONS[number];

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

function getCurrencySymbol(code?: string) {
  if (!code) return '';
  const c = currencies.find((c) => c.code === code);
  return c?.symbol ?? '';
}

function formatAmount(amount: number, currencyCode?: string) {
  const symbol = getCurrencySymbol(currencyCode) || '';
  return `${symbol}${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusBadgeVariant(status?: string) {
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');

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

        // Default sort: Request No. desc if available, else created desc
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

  // Helpers for date handling
  const getRequestDateMs = useCallback((r: FinanceRequest) => {
    // reimbursement -> 'Date Released'
    // requisition   -> 'Date Requested'
    const field =
      r.request_type === 'reimbursement' ? 'Date Released' : 'Date Requested';
    // @ts-ignore - dynamic field access
    const ts = r[field];
    const d = ts?.toDate?.();
    return d ? d.getTime() : 0;
  }, []);

  const getRequestDateLabel = (r: FinanceRequest) => {
    return r.request_type === 'reimbursement' ? 'Released' : 'Requested';
  };

  // Filtering
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return requests.filter((r) => {
      // Status filter
      const status = (r.Actions || '').toString();
      const matchesStatus =
        statusFilter === 'All' ? true : status.toLowerCase() === statusFilter.toLowerCase();

      // Type filter
      const matchesType =
        typeFilter === 'All' ? true : r.request_type === typeFilter;

      if (!matchesStatus || !matchesType) return false;

      if (!q) return true;

      // Search across all schema fields you care about
      const requestNo = String(r['Request No.'] ?? '').toLowerCase();
      const type = String(r.request_type ?? '').toLowerCase();
      const item = String(r['Requested Item'] ?? '').toLowerCase();
      const amountStr = String(r.Amount ?? '');
      const approvedBy = String(r['Approved By'] ?? '').toLowerCase();
      const statusStr = String(r.Actions ?? '').toLowerCase();
      const cashbackStr = String((r as any).Cashback ?? '');
      const orNo = String((r as any)['O.R No.'] ?? '').toLowerCase();
      const invoiceNo = String((r as any)['Invoice No.'] ?? '').toLowerCase();
      const quotation = String((r as any).Quotation ?? '').toLowerCase();
      const dateStr = (() => {
        const ms = getRequestDateMs(r);
        return ms ? format(new Date(ms), 'MMM dd, yyyy').toLowerCase() : '';
      })();

      const haystack = [
        requestNo,
        type,
        item,
        amountStr,
        approvedBy,
        statusStr,
        cashbackStr,
        orNo,
        invoiceNo,
        quotation,
        dateStr,
      ];

      return haystack.some((s) => s.includes(q));
    });
  }, [requests, searchQuery, statusFilter, typeFilter, getRequestDateMs]);

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...filtered];

    const cmpStr = (a?: string, b?: string) =>
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
        case 'type': {
          res = cmpStr(a.request_type, b.request_type);
          break;
        }
        case 'requestedItem': {
          res = cmpStr(a['Requested Item'], b['Requested Item']);
          break;
        }
        case 'amount': {
          const aAmt = Number(a.Amount ?? 0);
          const bAmt = Number(b.Amount ?? 0);
          res = aAmt - bAmt;
          break;
        }
        case 'approvedBy': {
          res = cmpStr(a['Approved By'], b['Approved By']);
          break;
        }
        case 'date': {
          const aMs = getRequestDateMs(a);
          const bMs = getRequestDateMs(b);
          res = aMs - bMs;
          break;
        }
        case 'cashback': {
          const aVal = Number((a as any).Cashback ?? 0);
          const bVal = Number((b as any).Cashback ?? 0);
          res = aVal - bVal;
          break;
        }
        case 'orNo': {
          res = cmpStr((a as any)['O.R No.'], (b as any)['O.R No.']);
          break;
        }
        case 'invoiceNo': {
          res = cmpStr((a as any)['Invoice No.'], (b as any)['Invoice No.']);
          break;
        }
        case 'quotation': {
          res = cmpStr((a as any).Quotation, (b as any).Quotation);
          break;
        }
        case 'status': {
          res = cmpStr(a.Actions, b.Actions);
          break;
        }
        default:
          res = 0;
      }

      return sortDirection === 'asc' ? res : -res;
    });

    return arr;
  }, [filtered, sortColumn, sortDirection, getRequestDateMs]);

  const toggleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      // Sensible default sort direction per column
      const defaultDescCols: SortColumn[] = ['requestNo', 'amount', 'date', 'cashback'];
      setSortDirection(defaultDescCols.includes(col) ? 'desc' : 'asc');
    }
  };

  const clearSearch = () => setSearchQuery('');
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setTypeFilter('All');
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
          <p className="text-muted-foreground">Spreadsheet view following your request schema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearFilters}>Reset</Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative lg:max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by any field (Request No., Item, Amount, Approved By, Status, OR/Invoice, etc.)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
            aria-label="Search requests"
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
            <SelectTrigger className="w-[170px]">
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

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type</span>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'All' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
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
            <Table className="min-w-[1200px]">
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
                      onClick={() => toggleSort('type')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Type'}
                      <SortIcon col="type" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap w-[320px]">
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
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Date'}
                      <SortIcon col="date" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('cashback')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Cashback'}
                      <SortIcon col="cashback" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('orNo')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'O.R No.'}
                      <SortIcon col="orNo" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('invoiceNo')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Invoice No.'}
                      <SortIcon col="invoiceNo" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('quotation')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Quotation'}
                      <SortIcon col="quotation" />
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
                  const dateMs = getRequestDateMs(r);
                  const dateStr = dateMs ? format(new Date(dateMs), 'MMM dd, yyyy') : '—';
                  const dateBadge = getRequestDateLabel(r); // Released / Requested

                  const cashback = (r as any).Cashback;
                  const orNo = (r as any)['O.R No.'];
                  const invoiceNo = (r as any)['Invoice No.'];
                  const quotation = (r as any).Quotation as string | undefined;

                  return (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium tabular-nums">
                        #{r['Request No.'] ?? '—'}
                      </TableCell>
                      <TableCell className="capitalize">
                        {r.request_type ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate">
                        {r['Requested Item'] ?? '—'}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {formatAmount(Number(r.Amount ?? 0), r.Currency ?? 'PHP')}
                      </TableCell>
                      <TableCell>{r['Approved By'] || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{dateStr}</span>
                          {dateMs ? (
                            <Badge variant="outline" className="text-xs">
                              {dateBadge}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {typeof cashback === 'number' ? cashback : '—'}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {orNo || '—'}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {invoiceNo || '—'}
                      </TableCell>
                      <TableCell>
                        {quotation ? (
                          <a
                            href={quotation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(r.Actions)}>{r.Actions || '—'}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
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
