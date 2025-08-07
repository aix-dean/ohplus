'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, MoreHorizontal, Eye, Trash2, Plus, FileText, DollarSign, Calendar, User, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { FinanceRequest } from '@/lib/types/finance-request';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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

const getCurrencySymbol = (currencyCode: string) => {
  const currency = currencies.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

const formatAmount = (amount: number, currencyCode: string) => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export default function RequestsView() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FinanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean;
    requestId: string;
    currentStatus: string;
    newStatus: string;
  }>({
    open: false,
    requestId: '',
    currentStatus: '',
    newStatus: ''
  });

  useEffect(() => {
    if (!user) return;

    const companyIdentifier = user.company_id || userData?.project_id || user.uid;
    
    const q = query(
      collection(db, 'request'),
      where('company_id', '==', companyIdentifier),
      where('deleted', '!=', true),
      orderBy('created', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData: FinanceRequest[] = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data(),
        } as FinanceRequest);
      });
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

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'request', requestId));
      toast({
        title: "Success",
        description: "Request deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (requestId: string) => {
    router.push(`/finance/requests/details/${requestId}`);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'request', requestId), {
        Actions: newStatus,
        updated: serverTimestamp(),
      });
      
      setStatusUpdateDialog({ open: false, requestId: '', currentStatus: '', newStatus: '' });
      
      toast({
        title: "Success",
        description: `Request status updated to ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openStatusUpdateDialog = (requestId: string, currentStatus: string, newStatus: string) => {
    setStatusUpdateDialog({
      open: true,
      requestId,
      currentStatus,
      newStatus
    });
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request['Request No.']?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.Requestor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request['Requested Item']?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.Actions?.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.Actions?.toLowerCase() === 'pending').length,
    approved: requests.filter(r => r.Actions?.toLowerCase() === 'approved').length,
    rejected: requests.filter(r => r.Actions?.toLowerCase() === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-12 animate-pulse mb-1" />
                <div className="h-3 bg-muted rounded w-24 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Successfully approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Declined requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Finance Requests</CardTitle>
              <CardDescription>
                Manage and track all finance requests
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/finance/requests/create')}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reimbursement">Reimbursement</SelectItem>
                <SelectItem value="requisition">Requisition</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requestor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No requests found</p>
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your search or filters
                          </p>
                        ) : (
                          <Button 
                            variant="outline" 
                            onClick={() => router.push('/finance/requests/create')}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first request
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        #{request['Request No.']}
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.request_type === 'reimbursement' ? 'outline' : 'secondary'}>
                          {request.request_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.Requestor}</TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(request.Amount, request.Currency || 'PHP')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.Actions)}>
                          {request.Actions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(request.created.toDate(), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(request.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {request.Actions?.toLowerCase() !== 'approved' && (
                              <DropdownMenuItem 
                                onClick={() => openStatusUpdateDialog(request.id, request.Actions, 'Approved')}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {request.Actions?.toLowerCase() !== 'rejected' && (
                              <DropdownMenuItem 
                                onClick={() => openStatusUpdateDialog(request.id, request.Actions, 'Rejected')}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            {request.Actions?.toLowerCase() !== 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => openStatusUpdateDialog(request.id, request.Actions, 'Pending')}
                                className="text-yellow-600"
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Set to Pending
                              </DropdownMenuItem>
                            )}
                            {request.Actions?.toLowerCase() !== 'processing' && (
                              <DropdownMenuItem 
                                onClick={() => openStatusUpdateDialog(request.id, request.Actions, 'Processing')}
                                className="text-blue-600"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Set to Processing
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteRequest(request.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={statusUpdateDialog.open} onOpenChange={(open) => 
        setStatusUpdateDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Request Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status from "{statusUpdateDialog.currentStatus}" to "{statusUpdateDialog.newStatus}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleStatusUpdate(statusUpdateDialog.requestId, statusUpdateDialog.newStatus)}
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
