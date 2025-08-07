'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { ReimbursementRequest, RequisitionRequest } from '@/lib/types/finance-request';

const ReimbursementTable = ({ data, isLoading }: { data: ReimbursementRequest[], isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">No reimbursement requests found.</p>
        <Link href="/finance/requests/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Request
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request No.</TableHead>
            <TableHead>Requestor</TableHead>
            <TableHead>Requested Item</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Date Released</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request['Request No.']}</TableCell>
              <TableCell>{request.Requestor}</TableCell>
              <TableCell className="max-w-xs truncate">{request['Requested Item']}</TableCell>
              <TableCell className="text-right">{request.Amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
              <TableCell>{request['Date Released'].toDate().toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant="outline">{request.Actions}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const RequisitionTable = ({ data, isLoading }: { data: RequisitionRequest[], isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">No requisition requests found.</p>
        <Link href="/finance/requests/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Request
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request No.</TableHead>
            <TableHead>Requestor</TableHead>
            <TableHead>Requested Item</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>O.R No.</TableHead>
            <TableHead>Invoice No.</TableHead>
            <TableHead>Date Requested</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request['Request No.']}</TableCell>
              <TableCell>{request.Requestor}</TableCell>
              <TableCell className="max-w-xs truncate">{request['Requested Item']}</TableCell>
              <TableCell className="text-right">{request.Amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
              <TableCell>{request['O.R No.']}</TableCell>
              <TableCell>{request['Invoice No.']}</TableCell>
              <TableCell>{request['Date Requested'].toDate().toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant="outline">{request.Actions}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default function RequestsView() {
  const { user } = useAuth();
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [requisitions, setRequisitions] = useState<RequisitionRequest[]>([]);
  const [isReimbursementLoading, setIsReimbursementLoading] = useState(true);
  const [isRequisitionLoading, setIsRequisitionLoading] = useState(true);

  useEffect(() => {
    if (!user?.company_id) {
      setIsReimbursementLoading(false);
      setIsRequisitionLoading(false);
      return;
    }

    const requestsCollection = collection(db, 'request');

    const qReimbursement = query(
      requestsCollection, 
      where('request_type', '==', 'reimbursement'), 
      where('company_id', '==', user.company_id)
    );
    const unsubscribeReimbursement = onSnapshot(qReimbursement, (querySnapshot) => {
      const reimbursementData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ReimbursementRequest[];
      setReimbursements(reimbursementData);
      setIsReimbursementLoading(false);
    }, (error) => {
      console.error("Error fetching reimbursements:", error);
      setIsReimbursementLoading(false);
    });

    const qRequisition = query(
      requestsCollection, 
      where('request_type', '==', 'requisition'), 
      where('company_id', '==', user.company_id)
    );
    const unsubscribeRequisition = onSnapshot(qRequisition, (querySnapshot) => {
      const requisitionData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RequisitionRequest[];
      setRequisitions(requisitionData);
      setIsRequisitionLoading(false);
    }, (error) => {
      console.error("Error fetching requisitions:", error);
      setIsRequisitionLoading(false);
    });

    return () => {
      unsubscribeReimbursement();
      unsubscribeRequisition();
    };
  }, [user]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="reimbursement" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full grid-cols-2 md:w-1/3">
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            <TabsTrigger value="requisition">Requisition</TabsTrigger>
          </TabsList>
          <Link href="/finance/requests/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Request
            </Button>
          </Link>
        </div>
        <TabsContent value="reimbursement">
          <ReimbursementTable data={reimbursements} isLoading={isReimbursementLoading} />
        </TabsContent>
        <TabsContent value="requisition">
          <RequisitionTable data={requisitions} isLoading={isRequisitionLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
