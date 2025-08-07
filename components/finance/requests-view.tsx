'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, X } from 'lucide-react';
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
    return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">No reimbursement requests found.</p></div>;
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
              <TableCell>{request['Requested Item']}</TableCell>
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
    return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">No requisition requests found.</p></div>;
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
              <TableCell>{request['Requested Item']}</TableCell>
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

interface CreateRequestFormData {
  request_type: 'reimbursement' | 'requisition';
  'Request No.': string;
  Requestor: string;
  'Requested Item': string;
  Amount: string;
  'Approved By': string;
  Attachments: File | null;
  Actions: string;
  // Reimbursement specific
  'Date Released': string;
  // Requisition specific
  Cashback: string;
  'O.R No.': string;
  'Invoice No.': string;
  Quotation: File | null;
  'Date Requested': string;
}

const CreateRequestDialog = ({ onRequestCreated }: { onRequestCreated: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateRequestFormData>({
    request_type: 'reimbursement',
    'Request No.': '',
    Requestor: '',
    'Requested Item': '',
    Amount: '',
    'Approved By': '',
    Attachments: null,
    Actions: 'Pending',
    'Date Released': '',
    Cashback: '',
    'O.R No.': '',
    'Invoice No.': '',
    Quotation: null,
    'Date Requested': '',
  });

  const handleInputChange = (field: keyof CreateRequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'Attachments' | 'Quotation', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File): Promise<string> => {
    // In a real implementation, you would upload to Firebase Storage
    // For now, we'll return a placeholder URL
    return `https://example.com/uploads/${file.name}`;
  };

  const generateRequestNumber = (): number => {
    return Math.floor(Math.random() * 900000) + 100000;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.company_id) {
      toast({
        title: "Error",
        description: "User company information not found.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files if present
      let attachmentsUrl = '';
      let quotationUrl = '';

      if (formData.Attachments) {
        attachmentsUrl = await uploadFile(formData.Attachments);
      }

      if (formData.Quotation) {
        quotationUrl = await uploadFile(formData.Quotation);
      }

      // Prepare the document data
      const baseData = {
        company_id: user.company_id,
        created: serverTimestamp(),
        request_type: formData.request_type,
        'Request No.': parseInt(formData['Request No.']) || generateRequestNumber(),
        Requestor: formData.Requestor,
        'Requested Item': formData['Requested Item'],
        Amount: parseFloat(formData.Amount) || 0,
        'Approved By': formData['Approved By'],
        Attachments: attachmentsUrl,
        Actions: formData.Actions,
      };

      let documentData;

      if (formData.request_type === 'reimbursement') {
        documentData = {
          ...baseData,
          'Date Released': formData['Date Released'] ? new Date(formData['Date Released']) : serverTimestamp(),
        };
      } else {
        documentData = {
          ...baseData,
          Cashback: parseInt(formData.Cashback) || 0,
          'O.R No.': formData['O.R No.'],
          'Invoice No.': formData['Invoice No.'],
          Quotation: quotationUrl,
          'Date Requested': formData['Date Requested'] ? new Date(formData['Date Requested']) : serverTimestamp(),
        };
      }

      // Add to Firestore
      await addDoc(collection(db, 'request'), documentData);

      toast({
        title: "Success",
        description: "Request created successfully.",
      });

      // Reset form and close dialog
      setFormData({
        request_type: 'reimbursement',
        'Request No.': '',
        Requestor: '',
        'Requested Item': '',
        Amount: '',
        'Approved By': '',
        Attachments: null,
        Actions: 'Pending',
        'Date Released': '',
        Cashback: '',
        'O.R No.': '',
        'Invoice No.': '',
        Quotation: null,
        'Date Requested': '',
      });
      setOpen(false);
      onRequestCreated();

    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Request</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new finance request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="request_type">Request Type</Label>
              <Select
                value={formData.request_type}
                onValueChange={(value: 'reimbursement' | 'requisition') => 
                  handleInputChange('request_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reimbursement">Reimbursement</SelectItem>
                  <SelectItem value="requisition">Requisition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="request_no">Request No. (Optional)</Label>
              <Input
                id="request_no"
                type="number"
                placeholder="Auto-generated if empty"
                value={formData['Request No.']}
                onChange={(e) => handleInputChange('Request No.', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestor">Requestor</Label>
              <Input
                id="requestor"
                required
                value={formData.Requestor}
                onChange={(e) => handleInputChange('Requestor', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                value={formData.Amount}
                onChange={(e) => handleInputChange('Amount', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="requested_item">Requested Item</Label>
              <Textarea
                id="requested_item"
                required
                value={formData['Requested Item']}
                onChange={(e) => handleInputChange('Requested Item', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approved_by">Approved By</Label>
              <Input
                id="approved_by"
                value={formData['Approved By']}
                onChange={(e) => handleInputChange('Approved By', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actions">Status</Label>
              <Select
                value={formData.Actions}
                onValueChange={(value) => handleInputChange('Actions', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="attachments">Attachments</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attachments"
                  type="file"
                  onChange={(e) => handleFileChange('Attachments', e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {formData.Attachments && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileChange('Attachments', null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Conditional fields based on request type */}
            {formData.request_type === 'reimbursement' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="date_released">Date Released</Label>
                <Input
                  id="date_released"
                  type="date"
                  value={formData['Date Released']}
                  onChange={(e) => handleInputChange('Date Released', e.target.value)}
                />
              </div>
            )}

            {formData.request_type === 'requisition' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cashback">Cashback</Label>
                  <Input
                    id="cashback"
                    type="number"
                    value={formData.Cashback}
                    onChange={(e) => handleInputChange('Cashback', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="or_no">O.R No.</Label>
                  <Input
                    id="or_no"
                    value={formData['O.R No.']}
                    onChange={(e) => handleInputChange('O.R No.', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_no">Invoice No.</Label>
                  <Input
                    id="invoice_no"
                    value={formData['Invoice No.']}
                    onChange={(e) => handleInputChange('Invoice No.', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_requested">Date Requested</Label>
                  <Input
                    id="date_requested"
                    type="date"
                    value={formData['Date Requested']}
                    onChange={(e) => handleInputChange('Date Requested', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="quotation">Quotation</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="quotation"
                      type="file"
                      onChange={(e) => handleFileChange('Quotation', e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    {formData.Quotation && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileChange('Quotation', null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function RequestsView() {
  const { user } = useAuth();
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [requisitions, setRequisitions] = useState<RequisitionRequest[]>([]);
  const [isReimbursementLoading, setIsReimbursementLoading] = useState(true);
  const [isRequisitionLoading, setIsRequisitionLoading] = useState(true);

  const handleRequestCreated = () => {
    // The real-time listeners will automatically update the data
    console.log('Request created successfully');
  };

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs defaultValue="reimbursement" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-full grid-cols-2 md:w-1/3">
              <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
              <TabsTrigger value="requisition">Requisition</TabsTrigger>
            </TabsList>
            <CreateRequestDialog onRequestCreated={handleRequestCreated} />
          </div>
          <TabsContent value="reimbursement">
            <ReimbursementTable data={reimbursements} isLoading={isReimbursementLoading} />
          </TabsContent>
          <TabsContent value="requisition">
            <RequisitionTable data={requisitions} isLoading={isRequisitionLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
