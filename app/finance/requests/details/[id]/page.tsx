'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, User, FileText, DollarSign, Building, Clock, CheckCircle, XCircle, AlertCircle, Download, ExternalLink, Expand, Shrink, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import type { FinanceRequest } from '@/lib/types/finance-request';

type AttachmentType = 'image' | 'video' | 'pdf' | 'document';
interface Attachment {
url: string;
name: string;
type: AttachmentType;
}

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

const getStatusIcon = (status: string) => {
switch (status.toLowerCase()) {
  case 'approved':
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  case 'pending':
    return <Clock className="h-5 w-5 text-yellow-600" />;
  case 'rejected':
    return <XCircle className="h-5 w-5 text-red-600" />;
  case 'processing':
    return <AlertCircle className="h-5 w-5 text-blue-600" />;
  default:
    return <Clock className="h-5 w-5 text-gray-600" />;
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

const getCurrencySymbol = (currencyCode: string) => {
const currency = currencies.find(c => c.code === currencyCode);
return currency?.symbol || currencyCode;
};

const formatAmount = (amount: number, currencyCode: string) => {
const symbol = getCurrencySymbol(currencyCode);
return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function RequestDetailsPage() {
const params = useParams();
const router = useRouter();
const { user, userData } = useAuth();
const { toast } = useToast();
const [request, setRequest] = useState<FinanceRequest | null>(null);
const [loading, setLoading] = useState(true);
const [notFound, setNotFound] = useState(false);

const [attachments, setAttachments] = useState<Attachment[]>([]);
const [galleryItems, setGalleryItems] = useState<Attachment[]>([]);
const [isGalleryOpen, setIsGalleryOpen] = useState(false);
const [galleryIndex, setGalleryIndex] = useState(0);
const [pdfPreview, setPdfPreview] = useState<Attachment | null>(null);
const [isFullscreen, setIsFullscreen] = useState(false);
const galleryRef = useRef<HTMLDivElement>(null);

const requestId = params.id as string;

const getFileType = (url: string): AttachmentType => {
  const extension = url.split('.').pop()?.split('?')[0].toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) return 'video';
  if (extension === 'pdf') return 'pdf';
  return 'document';
};

useEffect(() => {
  const fetchRequest = async () => {
    if (!requestId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'request', requestId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const companyIdentifier = user?.company_id || userData?.project_id || user?.uid;
        
        if (data.company_id !== companyIdentifier || data.deleted === true) {
          setNotFound(true);
        } else {
          const fetchedRequest = { id: docSnap.id, ...data } as FinanceRequest;
          setRequest(fetchedRequest);

          const allAttachments: Attachment[] = [];
          if (fetchedRequest.Attachments) {
            allAttachments.push({
              url: fetchedRequest.Attachments,
              name: 'Request Attachment',
              type: getFileType(fetchedRequest.Attachments),
            });
          }
          if (fetchedRequest.request_type === 'requisition' && fetchedRequest.Quotation) {
            allAttachments.push({
              url: fetchedRequest.Quotation,
              name: 'Quotation',
              type: getFileType(fetchedRequest.Quotation),
            });
          }
          setAttachments(allAttachments);
          setGalleryItems(allAttachments.filter(a => a.type === 'image' || a.type === 'video'));
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      toast({
        title: "Error",
        description: "Failed to fetch request details. Please try again.",
        variant: "destructive",
      });
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  fetchRequest();
}, [requestId, user, userData, toast]);

const handleBack = () => router.push('/finance/requests');

const handleDownloadAttachment = (url: string, name: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleViewAttachment = (attachment: Attachment) => {
  if (attachment.type === 'image' || attachment.type === 'video') {
    const index = galleryItems.findIndex(item => item.url === attachment.url);
    if (index !== -1) {
      setGalleryIndex(index);
      setIsGalleryOpen(true);
    }
  } else if (attachment.type === 'pdf') {
    setPdfPreview(attachment);
  }
};

const nextGalleryItem = () => setGalleryIndex((prev) => (prev + 1) % galleryItems.length);
const prevGalleryItem = () => setGalleryIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    galleryRef.current?.requestFullscreen().catch(err => {
      alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  } else {
    document.exitFullscreen();
  }
};

useEffect(() => {
  const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
}, []);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isGalleryOpen) {
      if (e.key === 'ArrowRight') nextGalleryItem();
      if (e.key === 'ArrowLeft') prevGalleryItem();
      if (e.key === 'Escape') setIsGalleryOpen(false);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isGalleryOpen, galleryItems]);

if (loading) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-muted rounded animate-pulse" />
        <div>
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-32 mt-2 animate-pulse" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

if (notFound || !request) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            The request you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Request #{request['Request No.']}
          </h1>
          <p className="text-muted-foreground">
            {request.request_type === 'reimbursement' ? 'Reimbursement' : 'Requisition'} Request Details
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusIcon(request.Actions)}
        <Badge variant={getStatusBadgeVariant(request.Actions)}>
          {request.Actions}
        </Badge>
      </div>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Request Number</span>
            <span className="font-medium">#{request['Request No.']}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Type</span>
            <Badge variant={request.request_type === 'reimbursement' ? 'outline' : 'secondary'}>
              {request.request_type}
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Requestor</span>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{request.Requestor}</span>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Amount</span>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-lg">
                {formatAmount(request.Amount, request.Currency || 'PHP')}
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Approved By</span>
            <span className="font-medium">{request['Approved By'] || 'Not specified'}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Created Date</span>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {request.created ? format(request.created.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Request Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Requested Item</span>
            <p className="mt-1 text-sm bg-muted p-3 rounded-md">
              {request['Requested Item']}
            </p>
          </div>
          <Separator />
          
          {request.request_type === 'reimbursement' && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Date Released</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {request['Date Released'] 
                    ? format(request['Date Released'].toDate(), 'MMM dd, yyyy')
                    : 'Not specified'
                  }
                </span>
              </div>
            </div>
          )}

          {request.request_type === 'requisition' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Cashback</span>
                <span className="font-medium">
                  {formatAmount(request.Cashback || 0, request.Currency || 'PHP')}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">O.R Number</span>
                <span className="font-medium">{request['O.R No.'] || 'Not specified'}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Invoice Number</span>
                <span className="font-medium">{request['Invoice No.'] || 'Not specified'}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Date Requested</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {request['Date Requested'] 
                      ? format(request['Date Requested'].toDate(), 'MMM dd, yyyy')
                      : 'Not specified'
                    }
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Attachments */}
    {attachments.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Attachments
          </CardTitle>
          <CardDescription>
            View attachments inline or download them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{attachment.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{attachment.type} file</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAttachment(attachment)}
                      disabled={attachment.type === 'document'}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment.url, attachment.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {pdfPreview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Preview: {pdfPreview.name}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPdfPreview(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden h-96">
                  <iframe
                    src={`${pdfPreview.url}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={pdfPreview.name}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Gallery Dialog */}
    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
      <DialogContent className="max-w-4xl w-full p-0 border-0 bg-transparent shadow-none">
        <div ref={galleryRef} className="relative bg-black/80 flex items-center justify-center rounded-lg">
          {galleryItems.length > 0 && (
            <>
              {galleryItems[galleryIndex].type === 'image' && (
                <img
                  src={galleryItems[galleryIndex].url || "/placeholder.svg"}
                  alt={galleryItems[galleryIndex].name}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              )}
              {galleryItems[galleryIndex].type === 'video' && (
                <video
                  controls
                  autoPlay
                  src={galleryItems[galleryIndex].url}
                  className="max-h-[80vh] max-w-full"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </>
          )}

          <div className="absolute top-2 right-2 flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20 hover:text-white">
              {isFullscreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsGalleryOpen(false)} className="text-white hover:bg-white/20 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {galleryItems.length > 1 && (
            <>
              <Button variant="ghost" size="icon" onClick={prevGalleryItem} className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 hover:text-white">
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextGalleryItem} className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 hover:text-white">
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
          
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
            {galleryItems.length > 0 ? `${galleryIndex + 1} / ${galleryItems.length}` : ''}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
);
}
