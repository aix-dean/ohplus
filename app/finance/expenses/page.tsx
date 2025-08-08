'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, onSnapshot, query, updateDoc, where, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Search, X, Calendar, FileText, User } from 'lucide-react';

import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { FinanceRequest } from '@/lib/types/finance-request';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const currencies = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
];

function getCurrencySymbol(currencyCode: string) {
  const currency = currencies.find((c) => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

function formatAmount(amount: number, currencyCode: string) {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusBadgeVariant(status: string) {
  switch (status?.toLowerCase()) {
    case 'done':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'processing':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getTypeBadgeVariant(type: string) {
  return type === 'reimbursement' ? 'outline' : 'secondary';
}

export default function ExpensesPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<FinanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load expenses from Firestore: using the same "request" collection
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
        const rows: FinanceRequest[] = [];
        snap.forEach((d) => {
          const data = d.data();
          rows.push({ id: d.id, ...data } as FinanceRequest);
        });

        // Sort newest first by created timestamp
        rows.sort((a, b) => {
          const at = a.created?.toDate?.() || new Date(0);
          const bt = b.created?.toDate?.() || new Date(0);
          return bt.getTime() - at.getTime();
        });

        setExpenses(rows);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading expenses:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch expenses. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, userData, toast]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return expenses;

    const q = searchQuery.toLowerCase().trim();
    return expenses.filter((e) => {
      const reqNo = e['Request No.']?.toString()?.toLowerCase() || '';
      const reqType = e.request_type?.toLowerCase() || '';
      const requestor = e.Requestor?.toLowerCase() || '';
      const item = e['Requested Item']?.toLowerCase() || '';
      const amount = e.Amount?.toString() || '';
      const currency = (e.Currency || 'PHP').toLowerCase();
      const approvedBy = (e['Approved By'] || '').toLowerCase();
      const status = (e.Actions || '').toLowerCase();
      const createdDate = e.created ? format(e.created.toDate(), 'MMM dd, yyyy').toLowerCase() : '';

      // Type-specific
      let typeSpecific = '';
      if (e.request_type === 'reimbursement' && (e as any)['Date Released']?.toDate) {
        typeSpecific = format((e as any)['Date Released'].toDate(), 'MMM dd, yyyy').toLowerCase();
      }
      if (e.request_type === 'requisition') {
        const orNo = ((e as any)['O.R No.'] || '').toLowerCase();
        const invoiceNo = ((e as any)['Invoice No.'] || '').toLowerCase();
        const dateRequested = (e as any)['Date Requested']?.toDate
          ? format((e as any)['Date Requested'].toDate(), 'MMM dd, yyyy').toLowerCase()
          : '';
        if (orNo.includes(q) || invoiceNo.includes(q) || dateRequested.includes(q)) return true;
      }

      return (
        reqNo.includes(q) ||
        reqType.includes(q) ||
        requestor.includes(q) ||
        item.includes(q) ||
        amount.includes(q) ||
        currency.includes(q) ||
        approvedBy.includes(q) ||
        status.includes(q) ||
        createdDate.includes(q) ||
        typeSpecific.includes(q)
      );
    });
  }, [expenses, searchQuery]);

  const handleSetStatus = async (id: string, status: 'Done' | 'Pending') => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, 'request', id), {
        Actions: status,
      });
      toast({
        title: 'Updated',
        description: `Status set to ${status}.`,
      });
    } catch (e) {
      console.error('Failed to update status:', e);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearSearch = () => setSearchQuery('');

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses Module</h1>
          <p className="text-muted-foreground">Ongoing History – Displays ongoing expenses</p>
        </div>
        <Link href="/finance">
          <Button variant="outline">Back to Finance</Button>
        </Link>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by request no., type, requestor, item, amount, status, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {searchQuery ? (
              <>
                Search Results
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filtered.length} of {expenses.length})
                </span>
              </>
            ) : (
              'Expenses – Ongoing History'
            )}
          </CardTitle>
          <CardDescription>
            {searchQuery ? (
              <>Showing results for "{searchQuery}"</>
            ) : (
              'Type shows whether the transaction is from reimbursement or requisition.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-6 bg-muted rounded w-40 animate-pulse" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchQuery ? 'No matching expenses found' : 'No expenses found'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery ? 'Try a different search term.' : 'Expenses will appear here as they are created.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requestor</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((exp) => {
                    const isDone = (exp.Actions || '').toLowerCase() === 'done';
                    const isPending = (exp.Actions || '').toLowerCase() === 'pending';

                    return (
                      <TableRow key={exp.id}>
                        <TableCell className="font-medium">#{exp['Request No.']}</TableCell>
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(exp.request_type)}>{exp.request_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {exp.Requestor}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{exp['Requested Item']}</TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(exp.Amount, exp.Currency || 'PHP')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(exp.Actions)}>{exp.Actions || 'Pending'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {exp.created?.toDate ? format(exp.created.toDate(), 'MMM dd, yyyy') : '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-6">
                            {/* Mark as Done */}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={isDone}
                                disabled={updatingId === exp.id}
                                onCheckedChange={(checked) => {
                                  // If checked, set Done; if unchecked, fall back to Pending
                                  handleSetStatus(exp.id, checked ? 'Done' : 'Pending');
                                }}
                                aria-label="Mark as Done"
                              />
                              <span className="text-sm">Mark as Done</span>
                            </label>

                            {/* Pending */}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={isPending}
                                disabled={updatingId === exp.id}
                                onCheckedChange={(checked) => {
                                  // If checked, set Pending; if unchecked, switch to Done
                                  handleSetStatus(exp.id, checked ? 'Pending' : 'Done');
                                }}
                                aria-label="Pending"
                              />
                              <span className="text-sm">Pending</span>
                            </label>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
