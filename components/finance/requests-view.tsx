'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ReimbursementRequest, RequisitionRequest, NewReimbursementRequest, NewRequisitionRequest } from '@/lib/types/finance-request';

const ReimbursementTable = ({ 
  data, 
  isLoading, 
  companyId 
}: { 
  data: ReimbursementRequest[], 
  isLoading: boolean,
  companyId: string 
}) => {
  const [newRows, setNewRows] = useState<NewReimbursementRequest[]>([]);
  const { toast } = useToast();

  // Initialize with one empty row if no data exists
  useEffect(() => {
    if (!isLoading && data.length === 0 && newRows.length === 0) {
      setNewRows([createEmptyReimbursementRow()]);
    }
  }, [data, isLoading, newRows.length]);

  const createEmptyReimbursementRow = (): NewReimbursementRequest => ({
    id: `new-${Date.now()}-${Math.random()}`,
    'Request No.': '',
    Requestor: '',
    'Requested Item': '',
    Amount: '',
    'Date Released': '',
    Actions: 'Pending',
    isNew: true
  });

  const handleInputChange = (rowId: string, field: keyof NewReimbursementRequest, value: string) => {
    setNewRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: value };
        
        // Check if this row has any data and add a new empty row if needed
        const hasData = Object.entries(updatedRow).some(([key, val]) => 
          key !== 'id' && key !== 'isNew' && key !== 'Actions' && val.toString().trim() !== ''
        );
        
        if (hasData && prev.length === prev.findIndex(r => r.id === rowId) + 1) {
          // This is the last row and has data, add a new empty row
          setTimeout(() => {
            setNewRows(current => [...current, createEmptyReimbursementRow()]);
          }, 0);
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  const saveRow = async (row: NewReimbursementRequest) => {
    if (!row.Requestor || !row['Requested Item'] || !row.Amount || !row['Date Released']) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const requestData = {
        company_id: companyId,
        created: Timestamp.now(),
        request_type: 'reimbursement',
        'Request No.': parseInt(row['Request No.']) || Math.floor(Math.random() * 10000),
        Requestor: row.Requestor,
        'Requested Item': row['Requested Item'],
        Amount: parseFloat(row.Amount),
        'Approved By': '',
        Attachments: '',
        Actions: row.Actions,
        'Date Released': Timestamp.fromDate(new Date(row['Date Released']))
      };

      await addDoc(collection(db, 'request'), requestData);
      
      // Remove the saved row from newRows
      setNewRows(prev => prev.filter(r => r.id !== row.id));
      
      toast({
        title: "Success",
        description: "Reimbursement request saved successfully"
      });
    } catch (error) {
      console.error('Error saving request:', error);
      toast({
        title: "Error",
        description: "Failed to save request",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
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
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request['Request No.']}</TableCell>
              <TableCell>{request.Requestor}</TableCell>
              <TableCell>{request['Requested Item']}</TableCell>
              <TableCell className="text-right">{request.Amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
              <TableCell>{request['Date Released'].toDate().toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant="outline">{request.Actions}</Badge>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          ))}
          {newRows.map((row) => (
            <TableRow key={row.id} className="bg-muted/20">
              <TableCell>
                <Input
                  value={row['Request No.']}
                  onChange={(e) => handleInputChange(row.id, 'Request No.', e.target.value)}
                  placeholder="Auto-generated"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row.Requestor}
                  onChange={(e) => handleInputChange(row.id, 'Requestor', e.target.value)}
                  placeholder="Enter requestor name"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row['Requested Item']}
                  onChange={(e) => handleInputChange(row.id, 'Requested Item', e.target.value)}
                  placeholder="Enter requested item"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={row.Amount}
                  onChange={(e) => handleInputChange(row.id, 'Amount', e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-right"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={row['Date Released']}
                  onChange={(e) => handleInputChange(row.id, 'Date Released', e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{row.Actions}</Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => saveRow(row)}
                  disabled={!row.Requestor || !row['Requested Item'] || !row.Amount}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const RequisitionTable = ({ 
  data, 
  isLoading, 
  companyId 
}: { 
  data: RequisitionRequest[], 
  isLoading: boolean,
  companyId: string 
}) => {
  const [newRows, setNewRows] = useState<NewRequisitionRequest[]>([]);
  const { toast } = useToast();

  // Initialize with one empty row if no data exists
  useEffect(() => {
    if (!isLoading && data.length === 0 && newRows.length === 0) {
      setNewRows([createEmptyRequisitionRow()]);
    }
  }, [data, isLoading, newRows.length]);

  const createEmptyRequisitionRow = (): NewRequisitionRequest => ({
    id: `new-${Date.now()}-${Math.random()}`,
    'Request No.': '',
    Requestor: '',
    'Requested Item': '',
    Amount: '',
    'O.R No.': '',
    'Invoice No.': '',
    'Date Requested': '',
    Actions: 'Pending',
    isNew: true
  });

  const handleInputChange = (rowId: string, field: keyof NewRequisitionRequest, value: string) => {
    setNewRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: value };
        
        // Check if this row has any data and add a new empty row if needed
        const hasData = Object.entries(updatedRow).some(([key, val]) => 
          key !== 'id' && key !== 'isNew' && key !== 'Actions' && val.toString().trim() !== ''
        );
        
        if (hasData && prev.length === prev.findIndex(r => r.id === rowId) + 1) {
          // This is the last row and has data, add a new empty row
          setTimeout(() => {
            setNewRows(current => [...current, createEmptyRequisitionRow()]);
          }, 0);
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  const saveRow = async (row: NewRequisitionRequest) => {
    if (!row.Requestor || !row['Requested Item'] || !row.Amount || !row['Date Requested']) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const requestData = {
        company_id: companyId,
        created: Timestamp.now(),
        request_type: 'requisition',
        'Request No.': parseInt(row['Request No.']) || Math.floor(Math.random() * 10000),
        Requestor: row.Requestor,
        'Requested Item': row['Requested Item'],
        Amount: parseFloat(row.Amount),
        'Approved By': '',
        Attachments: '',
        Actions: row.Actions,
        Cashback: 0,
        'O.R No.': row['O.R No.'],
        'Invoice No.': row['Invoice No.'],
        Quotation: '',
        'Date Requested': Timestamp.fromDate(new Date(row['Date Requested']))
      };

      await addDoc(collection(db, 'request'), requestData);
      
      // Remove the saved row from newRows
      setNewRows(prev => prev.filter(r => r.id !== row.id));
      
      toast({
        title: "Success",
        description: "Requisition request saved successfully"
      });
    } catch (error) {
      console.error('Error saving request:', error);
      toast({
        title: "Error",
        description: "Failed to save request",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
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
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request['Request No.']}</TableCell>
              <TableCell>{request.Requestor}</TableCell>
              <TableCell>{request['Requested Item']}</TableCell>
              <TableCell className="text-right">{request.Amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
              <TableCell>{request['O.R No.']}</TableCell>
              <TableCell>{request['Invoice No.']}</TableCell>
              <TableCell>{request['Date Requested'].toDate().toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant="outline">{request.Actions}</Badge>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          ))}
          {newRows.map((row) => (
            <TableRow key={row.id} className="bg-muted/20">
              <TableCell>
                <Input
                  value={row['Request No.']}
                  onChange={(e) => handleInputChange(row.id, 'Request No.', e.target.value)}
                  placeholder="Auto-generated"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row.Requestor}
                  onChange={(e) => handleInputChange(row.id, 'Requestor', e.target.value)}
                  placeholder="Enter requestor name"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row['Requested Item']}
                  onChange={(e) => handleInputChange(row.id, 'Requested Item', e.target.value)}
                  placeholder="Enter requested item"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={row.Amount}
                  onChange={(e) => handleInputChange(row.id, 'Amount', e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-right"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row['O.R No.']}
                  onChange={(e) => handleInputChange(row.id, 'O.R No.', e.target.value)}
                  placeholder="Enter O.R number"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row['Invoice No.']}
                  onChange={(e) => handleInputChange(row.id, 'Invoice No.', e.target.value)}
                  placeholder="Enter invoice number"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={row['Date Requested']}
                  onChange={(e) => handleInputChange(row.id, 'Date Requested', e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{row.Actions}</Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => saveRow(row)}
                  disabled={!row.Requestor || !row['Requested Item'] || !row.Amount}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
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

    const qReimbursement = query(requestsCollection, where('request_type', '==', 'reimbursement'), where('company_id', '==', user.company_id));
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

    const qRequisition = query(requestsCollection, where('request_type', '==', 'requisition'), where('company_id', '==', user.company_id));
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

  if (!user?.company_id) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Please log in to view requests.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="reimbursement" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-1/3">
        <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
        <TabsTrigger value="requisition">Requisition</TabsTrigger>
      </TabsList>
      <TabsContent value="reimbursement">
        <ReimbursementTable 
          data={reimbursements} 
          isLoading={isReimbursementLoading}
          companyId={user.company_id}
        />
      </TabsContent>
      <TabsContent value="requisition">
        <RequisitionTable 
          data={requisitions} 
          isLoading={isRequisitionLoading}
          companyId={user.company_id}
        />
      </TabsContent>
    </Tabs>
  );
}
