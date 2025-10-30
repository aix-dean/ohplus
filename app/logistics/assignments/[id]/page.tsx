"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import type { Product } from "@/lib/firebase-service"
import type { JobOrder } from "@/lib/types/job-order"
import { teamsService } from "@/lib/teams-service"
import type { Team } from "@/lib/types/team"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

import { ServiceAssignmentViewForm } from '@/components/logistics/assignments/view/ServiceAssignmentViewForm';
import { ServiceAssignmentSummaryBar } from '@/components/logistics/assignments/view/ServiceAssignmentSummaryBar';
import { generateServiceAssignmentDetailsPDF } from '@/lib/pdf-service';
import { CreateReportDialog } from '@/components/logistics/assignments/CreateReportDialog';

export default function ViewServiceAssignmentPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const assignmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [assignmentData, setAssignmentData] = useState<any>(null)
  const [jobOrderId, setJobOrderId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [jobOrderData, setJobOrderData] = useState<JobOrder | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false)
  const [pdfKey, setPdfKey] = useState<number>(0)
  const [isDataStable, setIsDataStable] = useState<boolean>(false)
  const [pdfLoadState, setPdfLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const pdfUrlRef = useRef<string | null>(null)
  const [isCreateReportDialogOpen, setIsCreateReportDialogOpen] = useState<boolean>(false)

  // Fetch assignment data
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return

      try {
        setLoading(true)
        const assignmentDoc = await getDoc(doc(db, "service_assignments", assignmentId))

        if (assignmentDoc.exists()) {
          const data = { id: assignmentDoc.id, ...assignmentDoc.data() } as any
          setAssignmentData(data)

          // Fetch job order if present
          if (data.jobOrderId) {
            const jobOrderDoc = await getDoc(doc(db, "job_orders", data.jobOrderId))
            if (jobOrderDoc.exists()) {
              setJobOrderData({ id: jobOrderDoc.id, ...jobOrderDoc.data() } as JobOrder)
            }
          }
        } else {
          toast({
            title: "Assignment not found",
            description: "The service assignment you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/logistics/assignments")
        }
      } catch (error) {
        console.error("Error fetching assignment:", error)
        toast({
          title: "Error",
          description: "Failed to load service assignment.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [assignmentId, router, toast])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, "products")
        const q = query(productsRef, where("deleted", "==", false), orderBy("name", "asc"), limit(100))
        const querySnapshot = await getDocs(q)

        const fetchedProducts: Product[] = []
        querySnapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() } as Product)
        })

        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
      }
    }

    fetchProducts()
  }, [])

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getAllTeams()
        const activeTeams = teamsData.filter((team) => team.status === "active")
        setTeams(activeTeams)
      } catch (error) {
        console.error("Error fetching teams:", error)
      }
    }

    fetchTeams()
  }, [])

  // Check if all data is stable
  useEffect(() => {
    const isStable = assignmentData && products.length >= 0 && teams.length >= 0 && !loading
    setIsDataStable(isStable)
  }, [assignmentData, products, teams, loading])

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

  // Fetch PDF as blob when all data is stable
  useEffect(() => {
    const loadPdf = async () => {
      console.log('PDF Loading: Starting enhanced PDF load process for assignment:', assignmentData?.id || assignmentData?.saNumber);
      console.log('PDF Loading: Assignment data keys:', Object.keys(assignmentData || {}));
      console.log('PDF Loading: Job order data available:', !!jobOrderData);
      console.log('PDF Loading: Products count:', products?.length || 0);
      console.log('PDF Loading: Teams count:', teams?.length || 0);

      // Batch state updates to reduce re-renders
      setPdfLoadState('loading');
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
            setPdfLoadState('error');
            setIsLoadingPdf(false);
            return;
          }
        }

        // Stage 3: Success
        loadStage = 'success';
        setPdfBlob(pdfBlob);
        setPdfError(null);
        setPdfLoadState('loaded');
        setIsLoadingPdf(false);
        console.log('PDF Loading: PDF loading process completed successfully');

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
        setPdfLoadState('error');
        setIsLoadingPdf(false);
      }
    };

    // Only load PDF if all data is stable
    if (isDataStable) {
      loadPdf();
    } else {
      console.warn('PDF Loading: Data not stable yet, skipping PDF load');
      setIsLoadingPdf(false);
      setPdfLoadState('idle');
    }
  }, [isDataStable]);

  // Create blob URL using useMemo for stable URL creation
  const pdfUrl = useMemo(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      console.log('PDF URL Memo: Created blob URL:', url);
      pdfUrlRef.current = url;
      return url;
    }
    // Clean up previous URL when pdfBlob becomes null
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }
    return null;
  }, [pdfBlob]);

  // Handle print functionality
  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // Handle download functionality
  const handleDownload = () => {
    if (pdfBlob && pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `ServiceAssignment-${assignmentData?.saNumber || 'Unknown'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle create report functionality
  const handleCreateReport = () => {
    setIsCreateReportDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading assignment...</span>
        </div>
      </div>
    )
  }

  if (!assignmentData) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex justify-center items-center py-8">
          <span className="text-gray-500">Assignment not found</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">View Service Assignment</h1>
      </div>

      {/* Service Assignment Info Header */}
      <ServiceAssignmentSummaryBar
        assignmentData={assignmentData}
        products={products}
        teams={teams}
        onPrint={handlePrint}
        onDownload={handleDownload}
        onCreateReport={handleCreateReport}
      />

      {/* Control Bar */}
      <div className="bg-[#565656] text-white px-4 py-1.5 text-xs font-medium">Control Bar</div>

      {/* Service Assignment Card */}
      <ServiceAssignmentViewForm
        assignmentData={assignmentData}
        products={products}
        teams={teams}
        jobOrderData={jobOrderData}
        pdfBlob={pdfBlob}
        pdfUrl={pdfUrl}
        pdfError={pdfError}
        isLoadingPdf={isLoadingPdf}
        pdfKey={pdfKey}
      />

      {/* Create Report Dialog */}
      <CreateReportDialog
        open={isCreateReportDialogOpen}
        onOpenChange={setIsCreateReportDialogOpen}
        assignmentId={assignmentId}
      />
    </div>
  )
}