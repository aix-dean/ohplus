'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Calendar, DollarSign, User, Trash2, Eye, Edit } from 'lucide-react';
import Link from 'next/link';
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
import { ResponsiveTable } from '@/components/responsive-table';

interface FinanceRequest {
  id: string;
  company_id: string;
  request_type: 'reimbursement' | 'requisition';
  'Request No.': number;
  Requestor: string;
  'Requested Item': string;
  Amount: number;
  'Approved By': string;
  Attachments: string;
  Actions: string;
  created: any;
  deleted: boolean;
  // Reimbursement specific
  'Date Released'?: any;
  // Requisition specific
  Cashback?: number;
  'O.R No.'?: string;
  'Invoice No.'?: string;
  Quotation?: string;
  'Date Requested'?: any;
}

export default function RequestsView() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FinanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Use project_id as company identifier if company_id is not available
    const companyIdentifier = user.company_id || userData?.project_id || user.uid;

    if (!companyIdentifier) {
      console.error('No company identifier found for user');
      setLoading(false);
      return;
    }

    console.log('Filtering requests for company_id:', companyIdentifier);

    // Query with multiple filters: company_id and deleted status
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
      
      console.log('Filtered requests count:', requestsData.length);
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData, toast]);

  const handleDeleteRequest = async (requestId: string) => {
    try {
      // Soft delete: set deleted field to true instead of actually deleting the document
      await updateDoc(doc(db, 'request', requestId), {
        deleted: true
      });
      toast({
        title: "Success",
        description: "Request deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request.",
        variant: "destructive",
      });
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance Requests</h1>
            <p className="text-muted-foreground">Manage reimbursements and requisitions</p>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const tableColumns = [
    {
      key: 'Request No.',
      label: 'Request No.',
      render: (request: FinanceRequest) => (
        <div className="font-medium">#{request['Request No.']}</div>
      ),
    },
    {
      key: 'request_type',
      label: 'Type',
      render: (request: FinanceRequest) => (
        <Badge variant="outline" className="capitalize">
          {request.request_type}
        </Badge>
      ),
    },
    {
      key: 'Requestor',
      label: 'Requestor',
      render: (request: FinanceRequest) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{request.Requestor}</span>
        </div>
      ),
    },
    {
      key: 'Requested Item',
      label: 'Item',
      render: (request: FinanceRequest) => (
        <div className="max-w-xs truncate" title={request['Requested Item']}>
          {request['Requested Item']}
        </div>
      ),
    },
    {
      key: 'Amount',
      label: 'Amount',
      render: (request: FinanceRequest) => (
        <div className="flex items-center gap-2 font-medium">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          {formatCurrency(request.Amount)}
        </div>
      ),
    },
    {
      key: 'Actions',
      label: 'Status',
      render: (request: FinanceRequest) => (
        <Badge variant={getStatusBadgeVariant(request.Actions)}>
          {request.Actions}
        </Badge>
      ),
    },
    {
      key: 'created',
      label: 'Date Created',
      render: (request: FinanceRequest) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDate(request.created)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (request: FinanceRequest) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" title="View Request">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Edit Request">
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" title="Delete Request">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Request</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete request #{request['Request No.']}? This action will move the request to trash but can be recovered if needed.
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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Requests</h1>
          <p className="text-muted-foreground">
            Manage reimbursements and requisitions
          </p>
        </div>
        <Link href="/finance/requests/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              You haven't created any finance requests yet. Create your first request to get started.
            </p>
            <Link href="/finance/requests/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
            <CardDescription>
              {requests.length} active request{requests.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable
              data={requests}
              columns={tableColumns}
              searchKey="Requested Item"
              searchPlaceholder="Search requests..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
