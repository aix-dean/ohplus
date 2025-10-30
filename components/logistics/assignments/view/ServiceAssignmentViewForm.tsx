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
  pdfBlob,
  pdfUrl,
  pdfError,
  isLoadingPdf,
  pdfKey,
}: {
  assignmentData: any;
  products: Product[];
  teams: Team[];
  jobOrderData: JobOrder | null;
  pdfBlob: Blob | null;
  pdfUrl: string | null;
  pdfError: string | null;
  isLoadingPdf: boolean;
  pdfKey: number;
}) {



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
              {isLoadingPdf && !pdfUrl ? (
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
                        // Retry functionality removed - PDF loading is now handled by parent component
                        window.location.reload();
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
                  src={`${pdfUrl}#zoom=110`}
                  className="w-full h-full border-0 bg-white"
                  title="Service Assignment PDF"
                  onLoad={() => console.log('PDF iframe loaded successfully')}
                  onError={() => console.log('PDF iframe failed to load')}
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