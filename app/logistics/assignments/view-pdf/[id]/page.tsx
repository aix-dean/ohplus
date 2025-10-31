"use client"

import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { GenericSuccessDialog } from "@/components/generic-success-dialog";
import { getTeamById } from "@/lib/teams-service";
import { CompanyService } from "@/lib/company-service";
import { generateServiceAssignmentPDF } from "@/lib/pdf-service";

export default function ViewPDFPage() {
   const { id } = useParams();
   const searchParams = useSearchParams();
   const router = useRouter();
   const { user, userData } = useAuth();
   const { toast } = useToast();
   const [creatingAssignment, setCreatingAssignment] = useState(false);
   const [pdfData, setPdfData] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [iframeError, setIframeError] = useState(false);
   const [showSuccessDialog, setShowSuccessDialog] = useState(false);
   const [successDialogProps, setSuccessDialogProps] = useState({
     title: "Success!",
     message: "Service Assignment has been sent successfully.",
     confirmButtonText: "OK"
   });
   const isPreview = id === 'preview';
   const jobOrderId = searchParams.get('jobOrderId') || 'Df4wxbfrO5EnAbml0r2I';

  useEffect(() => {
    const loadPDF = async () => {
      console.log('[PDF Loading] Starting PDF generation process');
      console.log('[PDF Loading] Current URL params - id:', id, 'isPreview:', isPreview);
      console.log('[PDF Loading] Local storage keys:', Object.keys(localStorage));
      setLoading(true);
      setError(null);

      try {
        // Enhanced localStorage validation
        const assignmentDataString = localStorage.getItem('serviceAssignmentData');
        console.log('[PDF Loading] Retrieved localStorage data:', assignmentDataString ? 'Found' : 'Not found');
        console.log('[PDF Loading] Data length:', assignmentDataString?.length || 0);

        if (!assignmentDataString) {
          const errorMsg = 'Assignment data not found in local storage. Please create a service assignment first.';
          console.error('[PDF Loading] Error:', errorMsg);
          console.error('[PDF Loading] Available localStorage keys:', Object.keys(localStorage));
          setError(errorMsg);
          setLoading(false);
          return;
        }

        let assignmentData;
        try {
          assignmentData = JSON.parse(assignmentDataString);
          console.log('[PDF Loading] Successfully parsed assignment data');
          console.log('[PDF Loading] Parsed data keys:', Object.keys(assignmentData));
          console.log('[PDF Loading] SA Number:', assignmentData.saNumber);
          console.log('[PDF Loading] Project Site:', assignmentData.projectSiteName);
        } catch (parseError) {
          const errorMsg = 'Invalid assignment data format in session storage.';
          console.error('[PDF Loading] JSON parse error:', parseError);
          console.error('[PDF Loading] Raw data preview:', assignmentDataString?.substring(0, 200));
          setError(errorMsg);
          setLoading(false);
          return;
        }

        // Data validation with fallback defaults for required fields
        console.log('[PDF Loading] Validating and setting defaults for required fields');

        // Provide default values for required fields if missing
        if (!assignmentData.saNumber) {
          assignmentData.saNumber = `SA-${Date.now()}`;
          console.log('[PDF Loading] Set default saNumber:', assignmentData.saNumber);
        }

        if (!assignmentData.projectSiteName) {
          assignmentData.projectSiteName = 'Project Site Name';
          console.log('[PDF Loading] Set default projectSiteName:', assignmentData.projectSiteName);
        }

        if (!assignmentData.serviceType) {
          assignmentData.serviceType = 'General Service';
          console.log('[PDF Loading] Set default serviceType:', assignmentData.serviceType);
        }

        if (!assignmentData.assignedTo) {
          assignmentData.assignedTo = 'Unassigned';
          console.log('[PDF Loading] Set default assignedTo:', assignmentData.assignedTo);
        }

        // Ensure optional fields have proper defaults
        assignmentData.projectSiteLocation = assignmentData.projectSiteLocation || '';
        assignmentData.assignedToName = assignmentData.assignedToName || '';
        assignmentData.serviceDuration = assignmentData.serviceDuration || '';
        assignmentData.priority = assignmentData.priority || 'Normal';
        assignmentData.equipmentRequired = assignmentData.equipmentRequired || '';
        assignmentData.materialSpecs = assignmentData.materialSpecs || '';
        assignmentData.crew = assignmentData.crew || '';
        assignmentData.gondola = assignmentData.gondola || '';
        assignmentData.technology = assignmentData.technology || '';
        assignmentData.sales = assignmentData.sales || '';
        assignmentData.remarks = assignmentData.remarks || '';
        assignmentData.alarmTime = assignmentData.alarmTime || '';
        assignmentData.attachments = assignmentData.attachments || [];
        assignmentData.serviceExpenses = assignmentData.serviceExpenses || [];

        console.log('[PDF Loading] Data validation and defaults completed');

        // Validate and set default date fields
        if (!assignmentData.startDate || isNaN(new Date(assignmentData.startDate).getTime())) {
          console.warn('[PDF Loading] Invalid or missing startDate, setting to current date');
          assignmentData.startDate = new Date().toISOString();
        }
        if (!assignmentData.endDate || isNaN(new Date(assignmentData.endDate).getTime())) {
          console.warn('[PDF Loading] Invalid or missing endDate, setting to 7 days from start');
          const startDate = new Date(assignmentData.startDate);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          assignmentData.endDate = endDate.toISOString();
        }
        if (!assignmentData.alarmDate || isNaN(new Date(assignmentData.alarmDate).getTime())) {
          console.warn('[PDF Loading] Invalid or missing alarmDate, setting to start date');
          assignmentData.alarmDate = assignmentData.startDate;
        }

        console.log('[PDF Loading] Data validation passed, proceeding to PDF generation');

        // Generate PDF using server-side API
        try {
          console.log('[PDF Loading] Calling server-side PDF generation API');

          // Fetch company data for PDF generation
          let companyData = null;
          if (userData?.company_id) {
            try {
              companyData = await CompanyService.getCompanyData(userData.company_id);
              console.log('[PDF Loading] Company data fetched:', companyData?.name);
            } catch (companyError) {
              console.warn('[PDF Loading] Failed to fetch company data:', companyError);
            }
          }

          // Prepare assignment data for API
          const apiAssignmentData = {
            saNumber: assignmentData.saNumber,
            projectSiteName: assignmentData.projectSiteName,
            projectSiteLocation: assignmentData.projectSiteLocation || '',
            serviceType: assignmentData.serviceType,
            assignedTo: assignmentData.assignedTo,
            assignedToName: assignmentData.assignedToName || '',
            serviceDuration: assignmentData.serviceDuration,
            priority: assignmentData.priority || '',
            equipmentRequired: assignmentData.equipmentRequired || '',
            materialSpecs: assignmentData.materialSpecs || '',
            crew: assignmentData.crew,
            gondola: assignmentData.gondola || '',
            technology: assignmentData.technology || '',
            sales: assignmentData.sales || '',
            remarks: assignmentData.remarks || '',
            startDate: assignmentData.startDate ? new Date(assignmentData.startDate) : null,
            endDate: assignmentData.endDate ? new Date(assignmentData.endDate) : null,
            alarmDate: assignmentData.alarmDate ? new Date(assignmentData.alarmDate) : null,
            alarmTime: assignmentData.alarmTime || '',
            attachments: assignmentData.attachments || [],
            serviceExpenses: assignmentData.serviceExpenses || [],
            status: "Sent",
            created: new Date(),
            requestedBy: {
              name: userData?.first_name && userData?.last_name
                ? `${userData.first_name} ${userData.last_name}`
                : user?.displayName || "Unknown User",
              department: "LOGISTICS",
            },
          };

          console.log('[PDF Loading] Sending request to /api/generate-service-assignment-pdf');

          const response = await fetch('/api/generate-service-assignment-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assignment: apiAssignmentData,
              companyData: companyData,
              logoDataUrl: null, // Logo handling can be added later if needed
              format: 'pdf',
              userData: userData,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }

          // Get PDF as ArrayBuffer and convert to base64
          const pdfBuffer = await response.arrayBuffer();
          const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

          console.log('[PDF Loading] PDF generation completed, base64 length:', pdfBase64.length);

          if (pdfBase64 && pdfBase64.length > 0) {
            console.log('[PDF Loading] Setting PDF data, first 50 chars:', pdfBase64.substring(0, 50));

            // Validate PDF data format
            if (!pdfBase64.startsWith('JVBERi0xLj') && !pdfBase64.startsWith('JVBERi0xLj')) {
              console.warn('[PDF Loading] PDF data does not start with PDF header, but proceeding...');
            }

            setPdfData(pdfBase64);
            setIframeError(false); // Reset iframe error state
          } else {
            const errorMsg = 'PDF generation returned empty result. Please check assignment data and try again.';
            console.error('[PDF Loading] Error:', errorMsg);
            setError(errorMsg);
          }
        } catch (pdfError) {
          console.error('[PDF Loading] Server-side PDF generation failed, attempting client-side fallback:', pdfError);

          // Fallback to client-side PDF generation using jsPDF
          try {
            console.log('[PDF Loading] Attempting client-side PDF generation fallback');

            // Prepare assignment data for client-side generation
            const clientAssignmentData = {
              saNumber: assignmentData.saNumber,
              projectSiteName: assignmentData.projectSiteName,
              projectSiteLocation: assignmentData.projectSiteLocation || '',
              serviceType: assignmentData.serviceType,
              assignedTo: assignmentData.assignedTo,
              assignedToName: assignmentData.assignedToName || '',
              serviceDuration: assignmentData.serviceDuration,
              priority: assignmentData.priority || '',
              equipmentRequired: assignmentData.equipmentRequired || '',
              materialSpecs: assignmentData.materialSpecs || '',
              crew: assignmentData.crew,
              gondola: assignmentData.gondola || '',
              technology: assignmentData.technology || '',
              sales: assignmentData.sales || '',
              remarks: assignmentData.remarks || '',
              startDate: assignmentData.startDate ? new Date(assignmentData.startDate) : null,
              endDate: assignmentData.endDate ? new Date(assignmentData.endDate) : null,
              alarmDate: assignmentData.alarmDate ? new Date(assignmentData.alarmDate) : null,
              alarmTime: assignmentData.alarmTime || '',
              attachments: assignmentData.attachments || [],
              serviceExpenses: assignmentData.serviceExpenses || [],
              status: "Sent",
              created: new Date(),
              requestedBy: {
                name: userData?.first_name && userData?.last_name
                  ? `${userData.first_name} ${userData.last_name}`
                  : user?.displayName || "Unknown User",
                department: "LOGISTICS",
              },
            };

            // Generate PDF using client-side jsPDF
            const pdfBase64 = await generateServiceAssignmentPDF(clientAssignmentData, true);

            if (pdfBase64 && pdfBase64.length > 0) {
              console.log('[PDF Loading] Client-side PDF generation successful, base64 length:', pdfBase64.length);

              // Validate PDF data format
              if (!pdfBase64.startsWith('JVBERi0xLj') && !pdfBase64.startsWith('JVBERi0xLj')) {
                console.warn('[PDF Loading] PDF data does not start with PDF header, but proceeding...');
              }

              setPdfData(pdfBase64);
              setIframeError(false); // Reset iframe error state
            } else {
              throw new Error('Client-side PDF generation returned empty result');
            }
          } catch (fallbackError) {
            console.error('[PDF Loading] Client-side fallback also failed:', fallbackError);
            let errorMsg = 'Failed to generate PDF. ';

            if (pdfError instanceof Error) {
              if (pdfError.message.includes('Failed to fetch')) {
                errorMsg += 'Network error. Please check your connection and try again.';
              } else if (pdfError.message.includes('HTTP')) {
                errorMsg += pdfError.message;
              } else {
                errorMsg += pdfError.message;
              }
            } else {
              errorMsg += 'An unexpected error occurred during PDF generation.';
            }

            setError(errorMsg);
          }
        }
      } catch (err) {
        console.error('[PDF Loading] Unexpected error:', err);
        const errorMsg = err instanceof Error
          ? `An error occurred: ${err.message}`
          : 'An unexpected error occurred while loading the PDF.';
        setError(errorMsg);
      } finally {
        console.log('[PDF Loading] Setting loading to false');
        setLoading(false);
      }
    };

    loadPDF();
  }, []);

  const handleConfirmAndCreate = async () => {
      if (!user) return;

      setCreatingAssignment(true);
      try {
        // Retrieve assignment data from local storage
        const assignmentDataString = localStorage.getItem('serviceAssignmentData');
        if (!assignmentDataString) {
          throw new Error('Assignment data not found in local storage');
        }

        const assignmentData = JSON.parse(assignmentDataString);

       // Fetch team name if assignedTo is a team ID
       let assignedToValue = assignmentData.assignedTo || assignmentData.crew || 'Unassigned';
       if (assignmentData.assignedTo && assignmentData.assignedTo !== assignmentData.crew && userData?.company_id) {
         try {
           const team = await getTeamById(assignmentData.assignedTo, userData.company_id);
           if (team) {
             assignedToValue = team.name;
           }
         } catch (error) {
           console.error("Error fetching team:", error);
           // Keep the original assignedTo value as fallback
         }
       }

       // Upload PDF to Firebase Storage with validation
       if (!pdfData || pdfData.length === 0) {
         throw new Error('PDF data is empty or invalid');
       }

       let pdfUrl: string;
       try {
         const pdfBlob = new Blob([Uint8Array.from(atob(pdfData), c => c.charCodeAt(0))], { type: 'application/pdf' });
         const pdfFileName = `service-assignments/${assignmentData.saNumber}-${Date.now()}.pdf`;
         const pdfRef = ref(storage, pdfFileName);
         await uploadBytes(pdfRef, pdfBlob);
         pdfUrl = await getDownloadURL(pdfRef);
       } catch (blobError) {
         console.error('Error creating PDF blob:', blobError);
         throw new Error('Failed to create PDF blob from data');
       }

       // Create service assignment data with defaults
       const firestoreAssignmentData = {
         saNumber: assignmentData.saNumber,
         projectSiteId: assignmentData.projectSiteId || '',
         projectSiteName: assignmentData.projectSiteName || 'Project Site Name',
         projectSiteLocation: assignmentData.projectSiteLocation || '',
         serviceType: assignmentData.serviceType,
         assignedTo: assignedToValue,
         assignedToName: assignmentData.assignedToName || '',
         serviceDuration: assignmentData.serviceDuration || '',
         priority: assignmentData.priority || 'Normal',
         equipmentRequired: assignmentData.equipmentRequired || '',
         materialSpecs: assignmentData.materialSpecs || '',
         crew: assignmentData.crew || '',
         gondola: assignmentData.gondola || '',
         technology: assignmentData.technology || '',
         sales: assignmentData.sales || '',
         remarks: assignmentData.remarks || '',
         message: assignmentData.message || '',
         campaignName: assignmentData.campaignName || '',
         coveredDateStart: Timestamp.fromDate(new Date(assignmentData.startDate)),
         coveredDateEnd: Timestamp.fromDate(new Date(assignmentData.endDate)),
         alarmDate: assignmentData.alarmDate ? Timestamp.fromDate(new Date(assignmentData.alarmDate)) : null,
         alarmTime: assignmentData.alarmTime || '',
         attachments: assignmentData.attachments || [],
         serviceExpenses: assignmentData.serviceExpenses || [],
         pdfUrl: pdfUrl,
         status: "Sent",
         updated: serverTimestamp(),
         project_key: userData?.license_key || '',
         company_id: userData?.company_id || null,
         jobOrderId: jobOrderId,
         requestedBy: {
           id: user.uid,
           name: userData?.first_name && userData?.last_name
             ? `${userData.first_name} ${userData.last_name}`
             : user?.displayName || "Unknown User",
           department: "LOGISTICS",
         },
       };

       // Create the service assignment in Firestore
       await addDoc(collection(db, "service_assignments"), {
         ...assignmentData,
         created: serverTimestamp(),
       });

       setSuccessDialogProps({
         title: "Success!",
         message: "Service Assignment has been sent successfully.",
         confirmButtonText: "OK"
       });
       setShowSuccessDialog(true);
     } catch (error) {
       console.error("Error creating service assignment:", error);
       toast({
         title: "Creation Failed",
         description: "Failed to create service assignment. Please try again.",
         variant: "destructive",
       });
     } finally {
       setCreatingAssignment(false);
     }
   };

  const handleSaveAsDraft = async () => {
     if (!user) return;

     setCreatingAssignment(true);
     try {
       // Retrieve assignment data from local storage
       const assignmentDataString = localStorage.getItem('serviceAssignmentData');
       if (!assignmentDataString) {
         throw new Error('Assignment data not found in local storage');
       }

       const assignmentData = JSON.parse(assignmentDataString);

       // Fetch team name if assignedTo is a team ID
       let assignedToValue = assignmentData.assignedTo || assignmentData.crew || 'Unassigned';
       if (assignmentData.assignedTo && assignmentData.assignedTo !== assignmentData.crew && userData?.company_id) {
         try {
           const team = await getTeamById(assignmentData.assignedTo, userData.company_id);
           if (team) {
             assignedToValue = team.name;
           }
         } catch (error) {
           console.error("Error fetching team:", error);
           // Keep the original assignedTo value as fallback
         }
       }

       // Upload PDF to Firebase Storage with validation
       if (!pdfData || pdfData.length === 0) {
         throw new Error('PDF data is empty or invalid');
       }

       let pdfUrl: string;
       try {
         const pdfBlob = new Blob([Uint8Array.from(atob(pdfData), c => c.charCodeAt(0))], { type: 'application/pdf' });
         const pdfFileName = `service-assignments/${assignmentData.saNumber}-${Date.now()}.pdf`;
         const pdfRef = ref(storage, pdfFileName);
         await uploadBytes(pdfRef, pdfBlob);
         pdfUrl = await getDownloadURL(pdfRef);
       } catch (blobError) {
         console.error('Error creating PDF blob:', blobError);
         throw new Error('Failed to create PDF blob from data');
       }

       // Create service assignment data with draft status
       const draftAssignmentData = {
         saNumber: assignmentData.saNumber,
         projectSiteId: assignmentData.projectSiteId || '',
         projectSiteName: assignmentData.projectSiteName || 'Project Site Name',
         projectSiteLocation: assignmentData.projectSiteLocation || '',
         serviceType: assignmentData.serviceType,
         assignedTo: assignedToValue,
         assignedToName: assignmentData.assignedToName || '',
         serviceDuration: assignmentData.serviceDuration || '',
         priority: assignmentData.priority || 'Normal',
         equipmentRequired: assignmentData.equipmentRequired || '',
         materialSpecs: assignmentData.materialSpecs || '',
         crew: assignmentData.crew || '',
         gondola: assignmentData.gondola || '',
         technology: assignmentData.technology || '',
         sales: assignmentData.sales || '',
         remarks: assignmentData.remarks || '',
         message: assignmentData.message || '',
         campaignName: assignmentData.campaignName || '',
         coveredDateStart: Timestamp.fromDate(new Date(assignmentData.startDate)),
         coveredDateEnd: Timestamp.fromDate(new Date(assignmentData.endDate)),
         alarmDate: assignmentData.alarmDate ? Timestamp.fromDate(new Date(assignmentData.alarmDate)) : null,
         alarmTime: assignmentData.alarmTime || '',
         attachments: assignmentData.attachments || [],
         serviceExpenses: assignmentData.serviceExpenses || [],
         pdfUrl: pdfUrl,
         status: "Draft",
         updated: serverTimestamp(),
         project_key: userData?.license_key || '',
         company_id: userData?.company_id || null,
         jobOrderId: jobOrderId,
         requestedBy: {
           id: user.uid,
           name: userData?.first_name && userData?.last_name
             ? `${userData.first_name} ${userData.last_name}`
             : user?.displayName || "Unknown User",
           department: "LOGISTICS",
         },
       };

       // Create the service assignment in Firestore
       await addDoc(collection(db, "service_assignments"), {
         ...draftAssignmentData,
         created: serverTimestamp(),
       });

       setSuccessDialogProps({
         title: "Success!",
         message: "Service Assignment has been saved as draft.",
         confirmButtonText: "OK"
       });
       setShowSuccessDialog(true);
     } catch (error) {
       console.error("Error saving draft:", error);
       toast({
         title: "Save Failed",
         description: "Failed to save draft. Please try again.",
         variant: "destructive",
       });
     } finally {
       setCreatingAssignment(false);
     }
   };

   const handleSuccessDialogClose = () => {
     setShowSuccessDialog(false);
   };

   const handleSuccessDialogConfirm = () => {
     setShowSuccessDialog(false);
     // Navigate to assignments list after dialog is confirmed
     router.push("/logistics/assignments");
   };

  return (
    <section className="p-8 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 pb-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 ">
          Create Service Assignment
        </h1>
      </div>

      <div className="relative w-full h-screen">
        {isPreview && (
        <div
          style={{
            display: 'flex',
            position: 'fixed',
            bottom: '20px',
            left: '60%',
            transform: 'translateX(-50%)',
            width: '300px',
            height: '67px',
            flexShrink: 0,
            borderRadius: '50px',
            border: '1.5px solid var(--GREY, #C4C4C4)',
            background: '#FFF',
            boxShadow: '-2px 4px 10.5px -2px rgba(0, 0, 0, 0.25)',
            zIndex: 10,
          }}
        >
          <div className="flex justify-center items-center" style={{ width: '100%', gap: '10px' }}>
            <Button
              variant="ghost"
              onClick={handleSaveAsDraft}
              disabled={creatingAssignment}
              style={{
                height: '27px',
                color: 'var(--Standard-Font-Color, #333)',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: '100%',
                textDecorationLine: 'underline',
                textDecorationStyle: 'solid',
                textDecorationSkipInk: 'auto',
                textDecorationThickness: 'auto',
                textUnderlineOffset: 'auto',
                textUnderlinePosition: 'from-font',
                padding: 0
              }}
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleConfirmAndCreate}
              disabled={creatingAssignment}
              style={{
                width: '126px',
                height: '27px',
                flexShrink: 0,
                borderRadius: '10px',
                background: '#1D0BEB',
                color: 'var(--Color, #FFF)',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: '100%'
              }}
            >
              {creatingAssignment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {creatingAssignment ? "Creating SA..." : "Send SA"}
            </Button>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="w-full h-screen flex justify-center">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading PDF...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        ) : pdfData ? (
            iframeError ? (
              // Fallback display when iframe fails
              <div className="w-[210mm] min-h-[297mm] bg-white shadow-md rounded-sm overflow-hidden flex flex-col items-center justify-center p-8">
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Display Error</h3>
                  <p className="text-gray-600 mb-4">
                    The PDF cannot be displayed inline. This may be due to browser limitations or corrupted PDF data.
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        // Create a download link for the PDF
                        const link = document.createElement('a');
                        link.href = `data:application/pdf;base64,${pdfData}`;
                        link.download = `service-assignment-${Date.now()}.pdf`;
                        link.click();
                      }}
                      className="mr-2"
                    >
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Try to reload the page to attempt iframe again
                        window.location.reload();
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>If the problem persists, try opening the downloaded PDF in an external PDF viewer.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-[210mm] min-h-[297mm] bg-white shadow-md rounded-sm overflow-hidden">
                {(() => {
                  console.log('[PDF Loading] Rendering iframe with data length:', pdfData.length);
                  console.log('[PDF Loading] PDF data starts with:', pdfData.substring(0, 50));
                  console.log('[PDF Loading] PDF data ends with:', pdfData.substring(pdfData.length - 50));
                  return null;
                })()}
                <iframe
                  src={`data:application/pdf;base64,${pdfData}#zoom=96&navpanes=0&sidebar=0&scrollbar=0`}
                  className="w-full h-full min-h-[297mm]"
                  title="PDF Viewer"
                  onLoad={() => {
                    console.log('[PDF Loading] Iframe loaded successfully');
                    setIframeError(false);
                  }}
                  onError={(e) => {
                    console.error('[PDF Loading] Iframe failed to load:', e);
                    console.error('[PDF Loading] PDF data that failed:', pdfData?.substring(0, 100));
                    setIframeError(true);
                    setError('Failed to display PDF in iframe. The PDF data may be corrupted or the browser does not support inline PDF viewing.');
                  }}
                />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No PDF data available</p>
                <Button onClick={() => router.back()}>Go Back</Button>
              </div>
            </div>
          )}
      </div>
    </div>

    {/* Success Dialog */}
    <GenericSuccessDialog
      isOpen={showSuccessDialog}
      onClose={handleSuccessDialogClose}
      onConfirm={handleSuccessDialogConfirm}
      title={successDialogProps.title}
      message={successDialogProps.message}
      type="general"
    />
    </section>
  );
}