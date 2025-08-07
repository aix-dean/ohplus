'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Eye, Edit, FileText, Calendar, User, Search, X, MoreHorizontal, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { FinanceRequest } from '@/lib/types/finance-request';

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

const statusOptions = [
  { value: 'Pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  { value: 'Approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600' },
  { value: 'Rejected', label: 'Rejected', icon: XCircle, color: 'text-red-600' },
  { value: 'Processing', label: 'Processing', icon: AlertCircle, color: 'text-blue-600' },
];

export default function RequestsView() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [requests, setRequests] = useState<FinanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const formatAmount = (amount: number, currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Comprehensive search function that searches across all relevant fields
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) {
      return requests;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return requests.filter((request) => {
      // Search in basic fields
      const requestNo = request['Request No.'].toString().toLowerCase();
      const requestType = request.request_type.toLowerCase();
      const requestor = request.Requestor.toLowerCase();
      const requestedItem = request['Requested Item'].toLowerCase();
      const amount = request.Amount.toString();
      const currency = (request.Currency || 'PHP').toLowerCase();
      const approvedBy = (request['Approved By'] || '').toLowerCase();
      const status = request.Actions.toLowerCase();
      
      // Search in date fields
      const createdDate = request.created ? format(request.created.toDate(), 'MMM dd, yyyy').toLowerCase() : '';
      
      // Search in type-specific fields
      let typeSpecificMatch = false;
      if (request.request_type === 'reimbursement') {
        const dateReleased = request['Date Released'] ? format(request['Date Released'].toDate(), 'MMM dd, yyyy').toLowerCase() : '';
        typeSpecificMatch = dateReleased.includes(query);
      } else if (request.request_type === 'requisition') {
        const cashback = (request.Cashback || 0).toString();
        const orNo = (request['O.R No.'] || '').toLowerCase();
        const invoiceNo = (request['Invoice No.'] || '').toLowerCase();
        const dateRequested = request['Date Requested'] ? format(request['Date Requested'].toDate(), 'MMM dd, yyyy').toLowerCase() : '';
        
        typeSpecificMatch = cashback.includes(query) || 
                           orNo.includes(query) || 
                           invoiceNo.includes(query) || 
                           dateRequested.includes(query);
      }

      // Check if query matches any field
      return requestNo.includes(query) ||
             requestType.includes(query) ||
             requestor.includes(query) ||
             requestedItem.includes(query) ||
             amount.includes(query) ||
             currency.includes(query) ||
             approvedBy.includes(query) ||
             status.includes(query) ||
             createdDate.includes(query) ||
             typeSpecificMatch;
    });
  }, [requests, searchQuery]);

  useEffect(() => {
    const companyIdentifier = user?.company_id || userData?.project_id || user?.uid;
    
    if (!companyIdentifier) {
      console.log('No company identifier found');
      setLoading(false);
      return;
    }

    console.log('Fetching requests for company:', companyIdentifier);

    const q = query(
      collection(db, 'request'),
      where('company_id', '==', companyIdentifier),
      where('deleted', '==', false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData: FinanceRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Request data:', { id: doc.id, company_id: data.company_id, deleted: data.deleted });
        requestsData.push({
          id: doc.id,
          ...data,
        } as FinanceRequest);
      });
      
      // Sort by creation date (newest first)
      requestsData.sort((a, b) => {
        const aTime = a.created?.toDate?.() || new Date(0);
        const bTime = b.created?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      console.log(`Found ${requestsData.length} requests`);
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch requests. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData, toast]);

  const handleViewDetails = (requestId: string) => {
    router.push(`/finance/requests/details/${requestId}`);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    setUpdatingStatusId(requestId);
    try {
      await updateDoc(doc(db, 'request', requestId), {
        Actions: newStatus
      });
      
      toast({
        title: "Success",
        description: `Request status updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    setDeletingId(requestId);
    try {
      await updateDoc(doc(db, 'request', requestId), {
        deleted: true
      });
      
      toast({
        title: "Success",
        description: "Request moved to trash successfully.",
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
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
  };

  const getRequestTypeBadgeVariant = (type: string) => {
    return type === 'reimbursement' ? 'outline' : 'secondary';
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
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search requests by number, type, requestor, item, amount, status, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
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
                  ({filteredRequests.length} of {requests.length} requests)
                </span>
              </>
            ) : (
              'All Requests'
            )}
          </CardTitle>
          <CardDescription>
            {searchQuery ? (
              <>
                Showing results for "{searchQuery}"
              </>
            ) : (
              'View and manage your finance requests'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchQuery ? 'No matching requests found' : 'No requests found'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery ? (
                  <>
                    Try adjusting your search terms or{' '}
                    <button
                      onClick={handleClearSearch}
                      className="text-primary hover:underline"
                    >
                      clear the search
                    </button>
                    .
                  </>
                ) : (
                  'Get started by creating your first finance request.'
                )}
              </p>
              {!searchQuery && (
                <Link href="/finance/requests/create">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Request
                  </Button>
                </Link>
              )}
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
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        #{request['Request No.']}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRequestTypeBadgeVariant(request.request_type)}>
                          {request.request_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {request.Requestor}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request['Requested Item']}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatAmount(request.Amount, request.Currency || 'PHP')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.Actions)}>
                          {request.Actions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(request.created.toDate(), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              disabled={updatingStatusId === request.id || deletingId === request.id}
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(request.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Request
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            {statusOptions.map((status) => {
                              const IconComponent = status.icon;
                              const isCurrentStatus = request.Actions === status.value;
                              return (
                                <DropdownMenuItem
                                  key={status.value}
                                  onClick={() => handleUpdateStatus(request.id, status.value)}
                                  disabled={isCurrentStatus || updatingStatusId === request.id}
                                  className={isCurrentStatus ? 'bg-muted' : ''}
                                >
                                  <IconComponent className={`mr-2 h-4 w-4 ${status.color}`} />
                                  {status.label}
                                  {isCurrentStatus && (
                                    <span className="ml-auto text-xs text-muted-foreground">Current</span>
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
                                    Are you sure you want to delete this request? This will move the request to trash and it can be recovered later if needed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteRequest(request.id)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
