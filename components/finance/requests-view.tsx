'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Calendar, CheckCircle, Clock, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, User, X } from 'lucide-react';

import type { FinanceRequest } from '@/lib/types/finance-request';

// Currency helpers (kept from existing behavior)
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

function getCurrencySymbol(currencyCode?: string) {
  if (!currencyCode) return '';
  const found = currencies.find((c) => c.code === currencyCode);
  return found?.symbol ?? '';
}

function formatAmount(amount: number, currencyCode?: string) {
  const sym = getCurrencySymbol(currencyCode || 'PHP');
  return `${sym}${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Status options (kept to preserve update functionality)
const statusOptions = [
  { value: 'Pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  { value: 'Approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600' },
  { value: 'Rejected', label: 'Rejected', icon: X, color: 'text-red-600' },
  { value: 'Processing', label: 'Processing', icon: AlertCircle, color: 'text-blue-600' },
] as const;

type SortDir = 'asc' | 'desc';
type SortCol = 'requestNo' | 'type' | 'requestor' | 'item' | 'amount' | 'status' | 'date';

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

function getRequestTypeBadgeVariant(type?: string) {
  return type === 'reimbursement' ? 'outline' : 'secondary';
}

export default function RequestsView() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<FinanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Existing functionalities preserved
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New: spreadsheet-like sorting
  const [sortCol, setSortCol] = useState<SortCol>('requestNo');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Fetch from Firestore (same constraints)
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

    const unsub = onSnapshot(
      q,
      (qs) => {
        const list: FinanceRequest[] = [];
        qs.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));

        // initial ordering by created desc (fallback to Request No.)
        list.sort((a, b) => {
          const at = a.created?.toDate?.()?.getTime?.() ?? 0;
          const bt = b.created?.toDate?.()?.getTime?.() ?? 0;
          if (bt !== at) return bt - at;
          const aNo = Number((a as any)['Request No.'] ?? 0);
          const bNo = Number((b as any)['Request No.'] ?? 0);
          return bNo - aNo;
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

    return () => unsub();
  }, [user, userData, toast]);

  // Preserve search across relevant fields
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requests;

    return requests.filter((r) => {
      const requestNo = String((r as any)['Request No.'] ?? '').toLowerCase();
      const requestType = String((r as any).request_type ?? '').toLowerCase();
      const requestor = String((r as any).Requestor ?? '').toLowerCase();
      const requestedItem = String((r as any)['Requested Item'] ?? '').toLowerCase();
      const amount = String((r as any).Amount ?? '');
      const currency = String((r as any).Currency ?? 'PHP').toLowerCase();
      const approvedBy = String((r as any)['Approved By'] ?? '').toLowerCase();
      const status = String((r as any).Actions ?? '').toLowerCase();
      const createdDate = (r as any).created
        ? format((r as any).created.toDate(), 'MMM dd, yyyy').toLowerCase()
        : '';

      // Type-specific fields still searchable
      const dateReleased = (r as any)['Date Released']
        ? format((r as any)['Date Released'].toDate(), 'MMM dd, yyyy').toLowerCase()
        : '';
      const cashback = String((r as any).Cashback ?? '');
      const orNo = String((r as any)['O.R No.'] ?? '').toLowerCase();
      const invoiceNo = String((r as any)['Invoice No.'] ?? '').toLowerCase();
      const dateRequested = (r as any)['Date Requested']
        ? format((r as any)['Date Requested'].toDate(), 'MMM dd, yyyy').toLowerCase()
        : '';

      const haystack = [
        requestNo,
        requestType,
        requestor,
        requestedItem,
        amount,
        currency,
        approvedBy,
        status,
        createdDate,
        dateReleased,
        cashback,
        orNo,
        invoiceNo,
        dateRequested,
      ];

      return haystack.some((s) => s.includes(q));
    });
  }, [requests, searchQuery]);

  // Sorting logic for spreadsheet headers
  const sorted = useMemo(() => {
    const arr = [...filtered];

    const cmpStr = (a?: string, b?: string) =>
      (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });

    arr.sort((a, b) => {
      let res = 0;

      switch (sortCol) {
        case 'requestNo': {
          const aNo = Number((a as any)['Request No.'] ?? 0);
          const bNo = Number((b as any)['Request No.'] ?? 0);
          res = aNo - bNo;
          break;
        }
        case 'type': {
          res = cmpStr((a as any).request_type, (b as any).request_type);
          break;
        }
        case 'requestor': {
          res = cmpStr((a as any).Requestor, (b as any).Requestor);
          break;
        }
        case 'item': {
          res = cmpStr((a as any)['Requested Item'], (b as any)['Requested Item']);
          break;
        }
        case 'amount': {
          const aAmt = Number((a as any).Amount ?? 0);
          const bAmt = Number((b as any).Amount ?? 0);
          res = aAmt - bAmt;
          break;
        }
        case 'status': {
          res = cmpStr((a as any).Actions, (b as any).Actions);
          break;
        }
        case 'date': {
          const at = (a as any).created?.toDate?.()?.getTime?.() ?? 0;
          const bt = (b as any).created?.toDate?.()?.getTime?.() ?? 0;
          res = at - bt;
          break;
        }
        default:
          res = 0;
      }

      return sortDir === 'asc' ? res : -res;
    });

    return arr;
  }, [filtered, sortCol, sortDir]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      // Default sensible directions
      setSortDir(['requestNo', 'amount', 'date'].includes(col) ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Existing handlers preserved
  const handleViewDetails = (requestId: string) => {
    router.push(`/finance/requests/details/${requestId}`);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    setUpdatingStatusId(requestId);
    try {
      await updateDoc(doc(db, 'request', requestId), { Actions: newStatus });
      toast({ title: 'Success', description: `Request status updated to ${newStatus}.` });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update request status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    setDeletingId(requestId);
    try {
      await updateDoc(doc(db, 'request', requestId), { deleted: true });
      toast({ title: 'Success', description: 'Request moved to trash successfully.' });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const clearSearch = () => setSearchQuery('');

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
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Requests</h1>
          <p className="text-muted-foreground">
            Manage your reimbursement and requisition requests
          </p>
        </div>
        <Link href="/finance/requests/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search requests by number, type, requestor, item, amount, status, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Search requests"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Spreadsheet-like table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchQuery ? (
              <>
                All Requests
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({sorted.length} of {requests.length})
                </span>
              </>
            ) : (
              'All Requests'
            )}
          </CardTitle>
          <CardDescription>View and manage your finance requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table className="min-w-[960px]">
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
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('requestor')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Requestor'}
                      <SortIcon col="requestor" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('item')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Item'}
                      <SortIcon col="item" />
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
                      onClick={() => toggleSort('status')}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {'Status'}
                      <SortIcon col="status" />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sorted.map((request) => {
                  const reqNo = (request as any)['Request No.'];
                  const created = (request as any).created?.toDate?.() as Date | undefined;
                  const dateStr = created ? format(created, 'MMM dd, yyyy') : '—';

                  return (
                    <TableRow key={(request as any).id} className="hover:bg-muted/50">
                      <TableCell className="font-medium tabular-nums">#{reqNo}</TableCell>

                      <TableCell>
                        <Badge variant={getRequestTypeBadgeVariant((request as any).request_type)}>
                          {(request as any).request_type}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {(request as any).Requestor}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-[280px] truncate">
                        {(request as any)['Requested Item']}
                      </TableCell>

                      <TableCell className="font-medium tabular-nums">
                        {formatAmount((request as any).Amount, (request as any).Currency || 'PHP')}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusBadgeVariant((request as any).Actions)}>
                          {(request as any).Actions}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {dateStr}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={
                                updatingStatusId === (request as any).id ||
                                deletingId === (request as any).id
                              }
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => handleViewDetails((request as any).id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Request
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>

                            {statusOptions.map((s) => {
                              const Icon = s.icon;
                              const isCurrent = (request as any).Actions === s.value;
                              return (
                                <DropdownMenuItem
                                  key={s.value}
                                  onClick={() =>
                                    handleUpdateStatus((request as any).id, s.value)
                                  }
                                  disabled={isCurrent || updatingStatusId === (request as any).id}
                                  className={isCurrent ? 'bg-muted' : ''}
                                >
                                  <Icon className={`mr-2 h-4 w-4 ${s.color}`} />
                                  {s.label}
                                  {isCurrent && (
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      Current
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}

                            <DropdownMenuSeparator />

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Request
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this request? This will move the
                                    request to trash and it can be recovered later if needed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteRequest((request as any).id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No requests found. Adjust your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile hint */}
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: On mobile, scroll the table horizontally to see all columns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
