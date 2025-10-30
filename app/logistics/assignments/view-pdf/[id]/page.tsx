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
import { generateServiceAssignmentHTMLPDF } from "@/lib/pdf-service";

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
      setLoading(true);
      setError(null);

      try {
        // Enhanced sessionStorage validation
        const assignmentDataString = sessionStorage.getItem('serviceAssignmentData');
        console.log('[PDF Loading] Retrieved sessionStorage data:', assignmentDataString ? 'Found' : 'Not found');

        if (!assignmentDataString) {
          const errorMsg = 'Assignment data not found in session storage. Please create a service assignment first.';
          console.error('[PDF Loading] Error:', errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        let assignmentData;
        try {
          assignmentData = JSON.parse(assignmentDataString);
          console.log('[PDF Loading] Successfully parsed assignment data:', assignmentData);
        } catch (parseError) {
          const errorMsg = 'Invalid assignment data format in session storage.';
          console.error('[PDF Loading] JSON parse error:', parseError);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        // Comprehensive data validation
        const requiredFields = ['saNumber', 'projectSiteName', 'serviceType', 'assignedTo'];
        const missingFields = requiredFields.filter(field => !assignmentData[field]);

        if (missingFields.length > 0) {
          const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
          console.error('[PDF Loading] Validation error:', errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        // Validate date fields
        if (assignmentData.startDate && isNaN(new Date(assignmentData.startDate).getTime())) {
          console.warn('[PDF Loading] Invalid startDate, setting to null');
          assignmentData.startDate = null;
        }
        if (assignmentData.endDate && isNaN(new Date(assignmentData.endDate).getTime())) {
          console.warn('[PDF Loading] Invalid endDate, setting to null');
          assignmentData.endDate = null;
        }
        if (assignmentData.alarmDate && isNaN(new Date(assignmentData.alarmDate).getTime())) {
          console.warn('[PDF Loading] Invalid alarmDate, setting to null');
          assignmentData.alarmDate = null;
        }

        console.log('[PDF Loading] Data validation passed, proceeding to PDF generation');

        // Regenerate PDF from stored assignment data with enhanced error handling
        try {
          console.log('[PDF Loading] Calling generateServiceAssignmentHTMLPDF');
          const pdfBase64 = await generateServiceAssignmentHTMLPDF(assignmentData, true);
          console.log('[PDF Loading] PDF generation completed, result:', pdfBase64 ? 'Success' : 'Failed');

          if (pdfBase64 && pdfBase64.length > 0) {
            console.log('[PDF Loading] Setting PDF data, length:', pdfBase64.length);
            setPdfData(pdfBase64);
          } else {
            const errorMsg = 'PDF generation returned empty result. Please check assignment data and try again.';
            console.error('[PDF Loading] Error:', errorMsg);
            setError(errorMsg);
          }
        } catch (pdfError) {
          console.error('[PDF Loading] PDF generation error:', pdfError);
          let errorMsg = 'Failed to generate PDF. ';

          if (pdfError instanceof Error) {
            if (pdfError.message.includes('html2canvas')) {
              errorMsg += 'HTML rendering failed. This may be due to browser compatibility issues.';
            } else if (pdfError.message.includes('canvas')) {
              errorMsg += 'Canvas rendering failed. Please refresh the page and try again.';
            } else {
              errorMsg += pdfError.message;
            }
          } else {
            errorMsg += 'An unexpected error occurred during PDF generation.';
          }

          setError(errorMsg);
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
        // Retrieve assignment data from session storage
        const assignmentDataString = sessionStorage.getItem('serviceAssignmentData');
        if (!assignmentDataString) {
          throw new Error('Assignment data not found in session storage');
        }

        const assignmentData = JSON.parse(assignmentDataString);

       // Fetch team name if assignedTo is a team ID
       let assignedToValue = assignmentData.assignedTo || assignmentData.crew;
       if (assignmentData.assignedTo && assignmentData.assignedTo !== assignmentData.crew && userData?.company_id) {
         try {
           const team = await getTeamById(assignmentData.assignedTo, userData.company_id);
           if (team) {
             assignedToValue = team.name;
           }
         } catch (error) {
           console.error("Error fetching team:", error);
         }
       }

       // Upload PDF to Firebase Storage
       const pdfBlob = new Blob([Uint8Array.from(atob(pdfData!), c => c.charCodeAt(0))], { type: 'application/pdf' });
       const pdfFileName = `service-assignments/${assignmentData.saNumber}-${Date.now()}.pdf`;
       const pdfRef = ref(storage, pdfFileName);
       await uploadBytes(pdfRef, pdfBlob);
       const pdfUrl = await getDownloadURL(pdfRef);

       // Create service assignment data
       const firestoreAssignmentData = {
         saNumber: assignmentData.saNumber,
         projectSiteId: assignmentData.projectSiteId,
         projectSiteName: assignmentData.projectSiteName || '',
         projectSiteLocation: assignmentData.projectSiteLocation || '',
         serviceType: assignmentData.serviceType,
         assignedTo: assignedToValue,
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
       // Retrieve assignment data from session storage
       const assignmentDataString = sessionStorage.getItem('serviceAssignmentData');
       if (!assignmentDataString) {
         throw new Error('Assignment data not found in session storage');
       }

       const assignmentData = JSON.parse(assignmentDataString);

       // Fetch team name if assignedTo is a team ID
       let assignedToValue = assignmentData.assignedTo || assignmentData.crew;
       if (assignmentData.assignedTo && assignmentData.assignedTo !== assignmentData.crew && userData?.company_id) {
         try {
           const team = await getTeamById(assignmentData.assignedTo, userData.company_id);
           if (team) {
             assignedToValue = team.name;
           }
         } catch (error) {
           console.error("Error fetching team:", error);
         }
       }

       // Upload PDF to Firebase Storage
       const pdfBlob = new Blob([Uint8Array.from(atob(pdfData!), c => c.charCodeAt(0))], { type: 'application/pdf' });
       const pdfFileName = `service-assignments/${assignmentData.saNumber}-${Date.now()}.pdf`;
       const pdfRef = ref(storage, pdfFileName);
       await uploadBytes(pdfRef, pdfBlob);
       const pdfUrl = await getDownloadURL(pdfRef);

       // Create service assignment data with draft status
       const draftAssignmentData = {
         saNumber: assignmentData.saNumber,
         projectSiteId: assignmentData.projectSiteId,
         projectSiteName: assignmentData.projectSiteName || '',
         projectSiteLocation: assignmentData.projectSiteLocation || '',
         serviceType: assignmentData.serviceType,
         assignedTo: assignedToValue,
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
            <div className="w-[210mm] min-h-[297mm] bg-white shadow-md rounded-sm overflow-hidden">
              <iframe
                src={`data:application/pdf;base64,${pdfData}#zoom=96&navpanes=0&sidebar=0&scrollbar=0`}
                className="w-full h-full min-h-[297mm]"
                title="PDF Viewer"
              />
            </div>
          ) : null}
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