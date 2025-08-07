'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Eye, FileText, Calendar, User, DollarSign, ChevronLeft, ChevronRight, Expand, Shrink, X, Play, ImageIcon, File } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { FinanceRequest } from '@/lib/types/finance-request';

type AttachmentType = 'image' | 'video' | 'pdf' | 'document';

interface Attachment {
  url: string;
  name: string;
  type: AttachmentType;
  field: 'Attachments' | 'Quotation';
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

const getFileType = (url: string): AttachmentType => {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return 'image';
  }
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) {
    return 'video';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
  return 'document';
};

const getFileName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || 'attachment';
    return decodeURIComponent(fileName);
  } catch {
    return 'attachment';
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

const getFileIcon = (type: AttachmentType) => {
  switch (type) {
    case 'image':
      return ImageIcon;
    case 'video':
      return Play;
    case 'pdf':
      return FileText;
    default:
      return File;
  }
};

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<FinanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const id = params.id as string;

  // Get viewable items (images and videos) for gallery
  const viewableItems = attachments.filter(att => att.type === 'image' || att.type === 'video');

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;

      try {
        const requestDoc = await getDoc(doc(db, 'request', id));
        
        if (requestDoc.exists()) {
          const requestData = { id: requestDoc.id, ...requestDoc.data() } as FinanceRequest;
          setRequest(requestData);

          // Process attachments
          const processedAttachments: Attachment[] = [];

          // Process main attachments
          if (requestData.Attachments) {
            processedAttachments.push({
              url: requestData.Attachments,
              name: getFileName(requestData.Attachments),
              type: getFileType(requestData.Attachments),
              field: 'Attachments'
            });
          }

          // Process quotation attachment
          if (requestData.Quotation) {
            processedAttachments.push({
              url: requestData.Quotation,
              name: getFileName(requestData.Quotation),
              type: getFileType(requestData.Quotation),
              field: 'Quotation'
            });
          }

          setAttachments(processedAttachments);
        } else {
          toast({
            title: "Error",
            description: "Request not found.",
            variant: "destructive",
          });
          router.push('/finance/requests');
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        toast({
          title: "Error",
          description: "Failed to fetch request details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, toast, router]);

  // Handle keyboard navigation in gallery
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!galleryOpen || viewableItems.length <= 1) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentGalleryIndex(prev => 
          prev > 0 ? prev - 1 : viewableItems.length - 1
        );
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentGalleryIndex(prev => 
          prev < viewableItems.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setGalleryOpen(false);
      }
    };

    if (galleryOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [galleryOpen, viewableItems.length]);

  const handleViewAttachment = (attachment: Attachment) => {
    if (attachment.type === 'image' || attachment.type === 'video') {
      const index = viewableItems.findIndex(item => item.url === attachment.url);
      setCurrentGalleryIndex(index >= 0 ? index : 0);
      setGalleryOpen(true);
    } else if (attachment.type === 'pdf') {
      setPdfPreview(attachment.url);
    }
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = useCallback(async () => {
    if (!galleryRef.current) return;

    try {
      if (!isFullscreen) {
        await galleryRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (viewableItems.length <= 1) return;

    setCurrentGalleryIndex(prev => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : viewableItems.length - 1;
      } else {
        return prev < viewableItems.length - 1 ? prev + 1 : 0;
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Request not found</h3>
        <p className="mt-2 text-muted-foreground">
          The request you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/finance/requests">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  const currentGalleryItem = viewableItems[currentGalleryIndex];

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
          <h1 className="text-2xl font-bold tracking-tight">
            Request #{request['Request No.']}
          </h1>
          <p className="text-muted-foreground">
            {request.request_type} request details
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Request Type</label>
              <div className="mt-1">
                <Badge variant={request.request_type === 'reimbursement' ? 'outline' : 'secondary'}>
                  {request.request_type}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Requestor</label>
              <p className="mt-1 font-medium">{request.Requestor}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusBadgeVariant(request.Actions)}>
                  {request.Actions}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date Created</label>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(request.created.toDate(), 'MMMM dd, yyyy')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <p className="mt-1 text-2xl font-bold">
                {formatAmount(request.Amount, request.Currency || 'PHP')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Currency</label>
              <p className="mt-1">{request.Currency || 'PHP'}</p>
            </div>
            {request['Approved By'] && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Approved By</label>
                <p className="mt-1">{request['Approved By']}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Requested Item</label>
              <p className="mt-1 whitespace-pre-wrap">{request['Requested Item']}</p>
            </div>
          </CardContent>
        </Card>

        {/* Type-specific Information */}
        {request.request_type === 'reimbursement' && request['Date Released'] && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Reimbursement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date Released</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(request['Date Released'].toDate(), 'MMMM dd, yyyy')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {request.request_type === 'requisition' && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Requisition Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {request.Cashback !== undefined && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cashback</label>
                  <p className="mt-1 font-medium">
                    {formatAmount(request.Cashback, request.Currency || 'PHP')}
                  </p>
                </div>
              )}
              {request['O.R No.'] && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">O.R No.</label>
                  <p className="mt-1">{request['O.R No.']}</p>
                </div>
              )}
              {request['Invoice No.'] && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice No.</label>
                  <p className="mt-1">{request['Invoice No.']}</p>
                </div>
              )}
              {request['Date Requested'] && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date Requested</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(request['Date Requested'].toDate(), 'MMMM dd, yyyy')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Attachments ({attachments.length})
              </CardTitle>
              <CardDescription>
                Click "View" to preview files or "Download" to save them locally
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {attachments.map((attachment, index) => {
                  const IconComponent = getFileIcon(attachment.type);
                  const canView = attachment.type === 'image' || attachment.type === 'video' || attachment.type === 'pdf';
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        <IconComponent className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={attachment.name}>
                          {attachment.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {attachment.type} • {attachment.field}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAttachment(attachment)}
                          disabled={!canView}
                          title={canView ? 'View file' : 'Preview not available'}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadAttachment(attachment)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF Preview */}
        {pdfPreview && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  PDF Preview
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPdfPreview(null)}
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 border rounded-lg overflow-hidden">
                <iframe
                  src={pdfPreview}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gallery Dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          <div ref={galleryRef} className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <h3 className="font-medium">
                    {currentGalleryItem?.name || 'Preview'}
                  </h3>
                  {viewableItems.length > 1 && (
                    <span className="text-sm text-white/70">
                      {currentGalleryIndex + 1} / {viewableItems.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? (
                      <Shrink className="h-4 w-4" />
                    ) : (
                      <Expand className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGalleryOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full h-full flex items-center justify-center p-16">
              {currentGalleryItem && (
                <>
                  {currentGalleryItem.type === 'image' ? (
                    <img
                      src={currentGalleryItem.url || "/placeholder.svg"}
                      alt={currentGalleryItem.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video
                      src={currentGalleryItem.url}
                      controls
                      className="max-w-full max-h-full"
                    />
                  )}
                </>
              )}
            </div>

            {/* Navigation */}
            {viewableItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateGallery('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateGallery('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
