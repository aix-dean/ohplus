'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import type { FinanceRequest } from '@/lib/types/finance-request';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckSquare, Clock, FileText, Search, User } from 'lucide-react';
import { format } from 'date-fns';

type ExpenseDoc = FinanceRequest & {
  expense_done?: boolean;
  expense_done_at?: unknown;
  expense_done_by?: string;
};

function isApproved(d: any): boolean {
  const candidates = [d?.status, d?.approval_status, d?.approvalStatus, d?.request_status, d?.finance_status];
  return candidates.some((v: any) => typeof v === 'string' && v.toLowerCase() === 'approved');
}

const currencyMap: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  SGD: 'S$',
  HKD: 'HK$',
  KRW: '₩',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  VND: '₫',
};

function getCurrencySymbol(code?: string) {
  if (!code) return '';
  return currencyMap[code] ?? code;
}

function formatAmount(amount: number, currency?: string) {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function typeBadgeVariant(type: string) {
  return type === 'reimbursement' ? 'outline' : 'secondary';
}

export default function ExpensesPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [items, setItems] = useState<ExpenseDoc[]>([]);

  // Fetch expenses from the same "request" collection and consider both reimbursement and requisition as expenses
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
      (snap) => {
        const data: ExpenseDoc[] = [];
        snap.forEach((d) => {
          const docData = d.data() as ExpenseDoc;
          // Only keep reimbursement/requisition that are Approved
          if (
            (docData.request_type === 'reimbursement' || docData.request_type === 'requisition') &&
            isApproved(docData)
          ) {
            data.push({ id: d.id, ...docData } as ExpenseDoc);
          }
        });

        // Newest first by created
        data.sort((a, b) => {
          const aTime = a.created?.toDate?.() ? a.created.toDate() : new Date(0);
          const bTime = b.created?.toDate?.() ? b.created.toDate() : new Date(0);
          return bTime.getTime() - aTime.getTime();
        });

        setItems(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading expenses:', err);
        toast({
          title: 'Error',
          description: 'Failed to load expenses. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, userData, toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((it) => {
      const requestNo = it['Request No.']?.toString()?.toLowerCase?.() ?? '';
      const type = it.request_type?.toLowerCase?.() ?? '';
      const requestor = it.Requestor?.toLowerCase?.() ?? '';
      const itemName = it['Requested Item']?.toLowerCase?.() ?? '';
      const amount = it.Amount?.toString?.() ?? '';
      const status = (it.expense_done ? 'done' : 'pending');
      const dateStr = it.created?.toDate?.() ? format(it.created.toDate(), 'MMM dd, yyyy').toLowerCase() : '';
      const currency = (it.Currency || '').toLowerCase();

      return (
        requestNo.includes(q) ||
        type.includes(q) ||
        requestor.includes(q) ||
        itemName.includes(q) ||
        amount.includes(q) ||
        currency.includes(q) ||
        status.includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [items, search]);

  const ongoing = useMemo(() => filtered.filter((it) => !it.expense_done), [filtered]);
  const history = useMemo(() => filtered.filter((it) => it.expense_done), [filtered]);

  const toggleDone = useCallback(
    async (id: string, next: boolean) => {
      try {
        setUpdatingId(id);
        const ref = doc(db, 'request', id);
        await updateDoc(ref, {
          expense_done: next,
          expense_done_at: serverTimestamp(),
          expense_done_by: user?.uid ?? 'system',
        });

        toast({
          title: next ? 'Marked as Done' : 'Marked as Pending',
          description: next
            ? 'This expense has been moved to History.'
            : 'This expense has been moved back to Ongoing.',
        });
      } catch (e) {
        console.error('Failed to update expense status', e);
        toast({
          title: 'Error',
          description: 'Could not update the expense status.',
          variant: 'destructive',
        });
      } finally {
        setUpdatingId(null);
      }
    },
    [toast, user?.uid]
  );

  const renderTable = (rows: ExpenseDoc[]) => {
    if (rows.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No records found</h3>
          <p className="mt-2 text-muted-foreground">
            Adjust your search or check back later.
          </p>
          <Link href="/finance/requests/create">
            <Button className="mt-4">Create Request</Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requestor</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">#{r['Request No.']}</TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant(r.request_type)}>
                    {r.request_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {r.Requestor}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{r['Requested Item']}</TableCell>
                <TableCell>
                  <span className="font-medium">
                    {formatAmount(r.Amount, r.Currency)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {r.created?.toDate?.() ? format(r.created.toDate(), 'MMM dd, yyyy') : '—'}
                  </div>
                </TableCell>
                <TableCell>
                  {r.expense_done ? (
                    <Badge variant="default" className="gap-1">
                      <CheckSquare className="h-3.5 w-3.5" />
                      Done
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`done-${r.id}`}
                        checked={!!r.expense_done}
                        disabled={updatingId === r.id}
                        onCheckedChange={(checked) => {
                          const next = Boolean(checked);
                          toggleDone(r.id, next);
                        }}
                      />
                      <label
                        htmlFor={`done-${r.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none"
                      >
                        Done
                      </label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/finance/requests/details/${r.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-40 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-muted rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">
            Approved expenses from reimbursement and requisition modules (only Approved status is shown)
          </p>
        </div>
        <Link href="/finance/requests/create">
          <Button>
            Create Expense
          </Button>
        </Link>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by request no., type, requestor, item, amount, status, or date..."
          className="pl-10 pr-10"
          aria-label="Search expenses"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            aria-label="Clear search"
          >
            ×
          </Button>
        )}
      </div>

      {/* Ongoing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Ongoing
            <span className="text-sm font-normal text-muted-foreground">
              ({ongoing.length} {ongoing.length === 1 ? 'item' : 'items'})
            </span>
          </CardTitle>
          <CardDescription>Pending expenses awaiting completion</CardDescription>
        </CardHeader>
        <CardContent>{renderTable(ongoing)}</CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
            History
            <span className="text-sm font-normal text-muted-foreground">
              ({history.length} {history.length === 1 ? 'item' : 'items'})
            </span>
          </CardTitle>
          <CardDescription>Completed expenses</CardDescription>
        </CardHeader>
        <CardContent>{renderTable(history)}</CardContent>
      </Card>
    </div>
  );
}
