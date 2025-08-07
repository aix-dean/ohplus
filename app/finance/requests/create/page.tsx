'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';

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

export default function CreateRequestPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateRequestFormData>({
    request_type: 'reimbursement',
    'Request No.': '',
    Requestor: user?.displayName || '',
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
    
    // Use project_id as company identifier if company_id is not available
    const companyIdentifier = user?.company_id || userData?.project_id || user?.uid;
    
    if (!companyIdentifier) {
      toast({
        title: "Error",
        description: "Unable to identify company information. Please try logging in again.",
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
        company_id: companyIdentifier,
        created: serverTimestamp(),
        deleted: false, // Add deleted field set to false for new requests
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

      // Navigate back to requests page
      router.push('/finance/requests');

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/requests">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Request</h1>
          <p className="text-muted-foreground">
            Fill out the form below to create a new finance request.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Provide the necessary information for your {formData.request_type} request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="request_type">Request Type *</Label>
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
                <Label htmlFor="request_no">Request No.</Label>
                <Input
                  id="request_no"
                  type="number"
                  placeholder="Auto-generated if empty"
                  value={formData['Request No.']}
                  onChange={(e) => handleInputChange('Request No.', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to auto-generate
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="requestor">Requestor *</Label>
                <Input
                  id="requestor"
                  required
                  value={formData.Requestor}
                  onChange={(e) => handleInputChange('Requestor', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.Amount}
                  onChange={(e) => handleInputChange('Amount', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_item">Requested Item *</Label>
              <Textarea
                id="requested_item"
                required
                placeholder="Describe the item or service being requested..."
                rows={3}
                value={formData['Requested Item']}
                onChange={(e) => handleInputChange('Requested Item', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="approved_by">Approved By</Label>
                <Input
                  id="approved_by"
                  placeholder="Enter approver name"
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
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="attachments">Attachments</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attachments"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
              {formData.Attachments && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.Attachments.name}
                </p>
              )}
            </div>

            {/* Conditional Fields */}
            {formData.request_type === 'reimbursement' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reimbursement Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="date_released">Date Released</Label>
                    <Input
                      id="date_released"
                      type="date"
                      value={formData['Date Released']}
                      onChange={(e) => handleInputChange('Date Released', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.request_type === 'requisition' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requisition Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cashback">Cashback</Label>
                      <Input
                        id="cashback"
                        type="number"
                        placeholder="0"
                        value={formData.Cashback}
                        onChange={(e) => handleInputChange('Cashback', e.target.value)}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="or_no">O.R No.</Label>
                      <Input
                        id="or_no"
                        placeholder="Enter O.R number"
                        value={formData['O.R No.']}
                        onChange={(e) => handleInputChange('O.R No.', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoice_no">Invoice No.</Label>
                      <Input
                        id="invoice_no"
                        placeholder="Enter invoice number"
                        value={formData['Invoice No.']}
                        onChange={(e) => handleInputChange('Invoice No.', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quotation">Quotation</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="quotation"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                    {formData.Quotation && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {formData.Quotation.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Link href="/finance/requests">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Request...' : 'Create Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
