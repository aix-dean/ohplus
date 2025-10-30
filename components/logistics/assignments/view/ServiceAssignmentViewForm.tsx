import { useState, useEffect } from 'react';
import { ServiceAssignmentViewCard } from './ServiceAssignmentViewCard';
import { ServiceExpenseViewCard } from './ServiceExpenseViewCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import type { Product } from "@/lib/firebase-service";
import type { Team } from "@/lib/types/team";
import type { JobOrder } from "@/lib/types/job-order";
import { generateServiceAssignmentDetailsPDF } from '@/lib/pdf-service';


// Job Order Details Card Component
function JobOrderDetailsCard({
  jobOrder,
}: {
  jobOrder: JobOrder;
}) {
  // Helper function to format date
  const formatDate = (date: string | Date | Timestamp | undefined) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : typeof date === 'string' ? new Date(date) : date.toDate();
      return format(dateObj, "MMM d, yyyy");
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">JOB ORDER</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex justify-between items-center">
          <p className="text-blue-600 font-medium">JO#: {jobOrder.joNumber}</p>
          <p className="text-sm text-gray-500">{formatDate(jobOrder.created)}</p>
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">JO Type:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.joType}</p>
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">Site Name:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.siteName}</p>
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">Deadline:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{formatDate(jobOrder.deadline)}</p>
        </div>
        <div className="space-y-2">
          <Label>Attachments:</Label>
          {jobOrder.siteImageUrl ? (
            <img
              src={jobOrder.siteImageUrl}
              alt="Site Image"
              className="rounded-md h-32 w-32 object-cover"
            />
          ) : jobOrder.attachments && jobOrder.attachments.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {jobOrder.attachments.slice(0, 4).map((attachment, index) => (
                <img
                  key={index}
                  src={attachment.url}
                  alt={attachment.name}
                  className="rounded-md h-16 w-16 object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No attachments</p>
          )}
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">Remarks:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.remarks || "N/A"}</p>
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">Requested by:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.requestedBy}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceAssignmentViewForm({
  assignmentData,
  products,
  teams,
  jobOrderData,
}: {
  assignmentData: any;
  products: Product[];
  teams: Team[];
  jobOrderData: JobOrder | null;
}) {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfKey, setPdfKey] = useState<number>(0); // Add key for iframe re-rendering


  // Enhanced data validation function
  const validatePdfGenerationData = (assignmentData: any, jobOrderData: any, products: any[], teams: any[]) => {
    const validationErrors: string[] = [];

    // Validate assignment data
    if (!assignmentData) {
      validationErrors.push('Assignment data is missing');
    } else {
      if (!assignmentData.saNumber) {
        validationErrors.push('Assignment SA number is missing');
      }
      if (!assignmentData.projectSiteName && !assignmentData.projectSiteId) {
        validationErrors.push('Project site information is missing');
      }
      if (!assignmentData.serviceType) {
        validationErrors.push('Service type is missing');
      }
    }

    // Validate products array
    if (!Array.isArray(products)) {
      validationErrors.push('Products data is not an array');
    } else if (products.length === 0) {
      console.warn('PDF Validation: No products data available - PDF may have limited site information');
    }

    // Validate teams array
    if (!Array.isArray(teams)) {
      validationErrors.push('Teams data is not an array');
    } else if (teams.length === 0) {
      console.warn('PDF Validation: No teams data available - PDF may have limited team information');
    }

    // Log validation results
    if (validationErrors.length > 0) {
      console.error('PDF Validation: Critical validation errors found:', validationErrors);
      return { isValid: false, errors: validationErrors };
    }

    console.log('PDF Validation: Data validation passed successfully');
    return { isValid: true, errors: [] };
  };

  // Enhanced error logging function
  const logPdfError = (stage: string, error: any, context?: any) => {
    const errorDetails = {
      stage,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error),
      context: context || {},
      assignmentId: assignmentData?.id || assignmentData?.saNumber || 'unknown',
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error(`PDF Error [${stage}]:`, errorDetails);

    // Could send to error reporting service here
    // Example: errorReportingService.log(errorDetails);
  };

  // Fetch PDF as blob when assignmentData changes
  useEffect(() => {
    const loadPdf = async () => {
      console.log('PDF Loading: Starting enhanced PDF load process for assignment:', assignmentData?.id || assignmentData?.saNumber);
      console.log('PDF Loading: Assignment data keys:', Object.keys(assignmentData || {}));
      console.log('PDF Loading: Job order data available:', !!jobOrderData);
      console.log('PDF Loading: Products count:', products?.length || 0);
      console.log('PDF Loading: Teams count:', teams?.length || 0);

      setIsLoadingPdf(true);
      setPdfError(null);

      let pdfBlob: Blob | null = null;
      let loadStage = 'initialization';

      try {
        // Stage 1: URL-based PDF loading (if available)
        if (assignmentData?.pdfUrl) {
          loadStage = 'url_fetch';
          console.log('PDF Loading: Attempting to fetch PDF from URL:', assignmentData.pdfUrl);

          try {
            const response = await fetch(assignmentData.pdfUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/pdf',
              },
              // Add timeout
              signal: AbortSignal.timeout(30000) // 30 second timeout
            });

            console.log('PDF Loading: Fetch response status:', response.status);

            if (!response.ok) {
              const errorMsg = `HTTP error! status: ${response.status} - ${response.statusText}`;
              logPdfError('url_fetch', new Error(errorMsg), { url: assignmentData.pdfUrl, status: response.status });
              throw new Error(errorMsg);
            }

            const contentType = response.headers.get('content-type');
            console.log('PDF Loading: Response content-type:', contentType);

            if (!contentType || !contentType.includes('application/pdf')) {
              const errorMsg = `Invalid content type, expected PDF but got: ${contentType}`;
              logPdfError('url_fetch', new Error(errorMsg), { contentType, url: assignmentData.pdfUrl });
              throw new Error(errorMsg);
            }

            const blob = await response.blob();
            console.log('PDF Loading: Successfully fetched PDF blob, size:', blob.size, 'bytes');

            if (blob.size === 0) {
              const errorMsg = 'PDF file is empty';
              logPdfError('url_fetch', new Error(errorMsg), { blobSize: blob.size, url: assignmentData.pdfUrl });
              throw new Error(errorMsg);
            }

            if (blob.size < 1000) {
              console.warn('PDF Loading: PDF blob is very small, might be corrupted:', blob.size, 'bytes');
            }

            pdfBlob = blob;
            console.log('PDF Loading: PDF loaded successfully from URL');
          } catch (urlError) {
            console.warn('PDF Loading: URL fetch failed, proceeding to generation fallback:', urlError instanceof Error ? urlError.message : String(urlError));
            logPdfError('url_fetch_fallback', urlError, { url: assignmentData.pdfUrl });
          }
        }

        // Stage 2: PDF generation (if URL failed or not available)
        if (!pdfBlob) {
          loadStage = 'data_validation';
          console.log('PDF Loading: Starting PDF generation process');

          // Validate data before generation
          const validation = validatePdfGenerationData(assignmentData, jobOrderData, products, teams);
          if (!validation.isValid) {
            const errorMsg = `Data validation failed: ${validation.errors.join(', ')}`;
            logPdfError('data_validation', new Error(errorMsg), {
              validationErrors: validation.errors,
              assignmentData: assignmentData,
              jobOrderData: jobOrderData,
              productsCount: products?.length,
              teamsCount: teams?.length
            });
            throw new Error(errorMsg);
          }

          loadStage = 'pdf_generation';
          console.log('PDF Loading: Attempting PDF generation using pdf-service');

          try {
            const pdfBase64 = await generateServiceAssignmentDetailsPDF(
              assignmentData,
              jobOrderData,
              products,
              teams,
              true // returnBase64 = true
            );

            console.log('PDF Loading: PDF generation result type:', typeof pdfBase64, 'length:', pdfBase64?.length);

            if (!pdfBase64 || pdfBase64.length === 0) {
              const errorMsg = 'PDF generation returned empty result';
              logPdfError('pdf_generation', new Error(errorMsg), {
                resultType: typeof pdfBase64,
                resultLength: pdfBase64?.length,
                assignmentData: assignmentData
              });
              throw new Error(errorMsg);
            }

            // Convert base64 to blob with error handling
            loadStage = 'base64_conversion';
            const byteCharacters = atob(pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

            console.log('PDF Loading: Successfully generated PDF, size:', pdfBlob.size, 'bytes');

            if (pdfBlob.size === 0) {
              const errorMsg = 'Generated PDF blob is empty';
              logPdfError('base64_conversion', new Error(errorMsg), { blobSize: pdfBlob.size });
              throw new Error(errorMsg);
            }

          } catch (generationError) {
            logPdfError('pdf_generation', generationError, {
              assignmentData: assignmentData,
              jobOrderData: jobOrderData,
              productsCount: products?.length,
              teamsCount: teams?.length
            });

            // Provide user-friendly error message based on error type
            let userFriendlyMessage = 'Failed to generate PDF. Please try again.';
            const errorMessage = generationError instanceof Error ? generationError.message : String(generationError);
            if (errorMessage.includes('validation failed')) {
              userFriendlyMessage = 'Unable to generate PDF due to missing assignment data. Please ensure all required information is provided.';
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
              userFriendlyMessage = 'Network error occurred while generating PDF. Please check your connection and try again.';
            }

            setPdfError(userFriendlyMessage);
            setIsLoadingPdf(false);
            return;
          }
        }

        // Stage 3: Success
        loadStage = 'success';
        setPdfBlob(pdfBlob);
        setPdfError(null);
        setIsLoadingPdf(false);
        setPdfKey(prev => prev + 1); // Increment key to force iframe re-render
        console.log('PDF Loading: PDF loading process completed successfully, key incremented to:', pdfKey + 1);

      } catch (error) {
        logPdfError(loadStage, error, {
          assignmentData: assignmentData,
          jobOrderData: jobOrderData,
          productsCount: products?.length,
          teamsCount: teams?.length
        });

        // Fallback: Try to show a basic error message and allow retry
        const fallbackMessage = loadStage === 'data_validation'
          ? 'Unable to load PDF due to missing or invalid data. Please contact support if this persists.'
          : 'Failed to load PDF file. Please try refreshing the page.';

        setPdfError(fallbackMessage);
        setIsLoadingPdf(false);
      }
    };

    // Only load PDF if we have assignment data
    if (assignmentData) {
      loadPdf();
    } else {
      console.warn('PDF Loading: No assignment data available, skipping PDF load');
      setIsLoadingPdf(false);
    }
  }, [assignmentData, jobOrderData, products, teams]);

  // Create blob URL when pdfBlob changes
  useEffect(() => {
    console.log('PDF URL Effect: pdfBlob changed, current blob:', pdfBlob ? `size: ${pdfBlob.size} bytes` : 'null');
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      console.log('PDF URL Effect: Created blob URL:', url);
      setPdfUrl(url);
      return () => {
        console.log('PDF URL Effect: Revoking blob URL:', url);
        URL.revokeObjectURL(url);
      };
    } else {
      console.log('PDF URL Effect: Setting pdfUrl to null');
      setPdfUrl(null);
    }
  }, [pdfBlob]);

  // Helper function to safely parse and validate dates
  const parseDateSafely = (dateValue: any): Date | null => {
    if (!dateValue) return null

    try {
      let date: Date

      if (dateValue instanceof Date) {
        date = dateValue
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue)
        if (isNaN(date.getTime())) {
          return null
        }
      } else if (typeof dateValue === 'number') {
        date = new Date(dateValue * 1000)
      } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000)
      } else {
        return null
      }

      if (isNaN(date.getTime())) {
        return null
      }

      return date
    } catch (error) {
      console.warn('Error parsing date:', dateValue, error)
      return null
    }
  }

  // Get site information - prioritize assignment data, then fall back to product lookup
  const selectedProduct = products.find(p => p.id === assignmentData.projectSiteId)
  const selectedTeam = teams.find(t => t.id === assignmentData.crew)
  const siteCode = selectedProduct?.site_code || assignmentData.projectSiteId?.substring(0, 8) || "-"
  const siteName = assignmentData.projectSiteName || selectedProduct?.name || "-"

  return (
    <>
      <ServiceAssignmentViewCard
        assignmentData={assignmentData}
        products={products}
        teams={teams}
        jobOrderData={jobOrderData}
      />

      {/* Service Assignment PDF Display */}
      <div className="relative isolate bg-card text-card-foreground max-w-full min-w-0 overflow-x-auto md:overflow-visible break-words hyphens-auto p-0 shadow-lg border-2 border-[#565656]">
        <div className="">
          {assignmentData.pdfUrl ? (
            <div className="w-full h-[842px] max-h-screen bg-white">
              {isLoadingPdf ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div className="text-center">
                    <p className="text-gray-600 font-medium">Loading PDF...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your document</p>
                  </div>
                </div>
              ) : pdfError ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
                  <div className="text-red-500 text-center">
                    <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-red-800">PDF Loading Failed</h3>
                    <p className="mt-1 text-sm text-red-600">{pdfError}</p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Refresh Page
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setPdfError(null);
                        setIsLoadingPdf(true);
                        // Trigger PDF reload by updating a dependency
                        setPdfBlob(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Retry Loading
                    </Button>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  key={pdfKey} // Use pdfKey instead of pdfUrl for consistent re-rendering
                  src={pdfUrl}
                  className="w-full h-full border-0 bg-white"
                  title="Service Assignment PDF"
                />
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">PDF Not Available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No PDF URL is configured for this service assignment.
                  {assignmentData?.saNumber && ` (SA#: ${assignmentData.saNumber})`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  PDF will be generated automatically when the assignment is created or updated.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}