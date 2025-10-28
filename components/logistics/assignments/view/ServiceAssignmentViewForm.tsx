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

      {/* Service Assignment Information Display */}
      <div className="relative isolate bg-card text-card-foreground max-w-full min-w-0 overflow-x-auto md:overflow-visible break-words hyphens-auto p-0 shadow-lg border-2 border-[#565656]">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">sdsSERVICE ASSIGNMENT SUMMARY</h2>

          <div className="mb-6">
            <p className="text-blue-600 font-medium">Tagged JO: {jobOrderData?.joNumber || "N/A"}</p>
            <p className="text-sm text-gray-500">Recipient: Production Team</p>
            <p className="text-sm text-gray-500">SA#: {assignmentData.saNumber || "N/A"}</p>
            <p className="text-sm text-gray-500">Issued on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Service Assignment Information:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Site Name:</span>
                  <span>{siteName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Site Address:</span>
                  <span>{assignmentData.siteAddress || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Campaign Name:</span>
                  <span>{assignmentData.campaignName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Service Type:</span>
                  <span>{assignmentData.serviceType || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Material Specs:</span>
                  <span>{assignmentData.materialSpecs || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Service Start Date:</span>
                  <span>{assignmentData.coveredDateStart ? format(parseDateSafely(assignmentData.coveredDateStart)!, "MMMM d, yyyy") : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Service End Date:</span>
                  <span>{assignmentData.coveredDateEnd ? format(parseDateSafely(assignmentData.coveredDateEnd)!, "MMMM d, yyyy") : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Crew:</span>
                  <span>{selectedTeam?.name || assignmentData.assignedTo || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Remarks:</span>
                  <span>{assignmentData.remarks || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}