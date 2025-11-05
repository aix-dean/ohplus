import { ServiceAssignmentCard } from './ServiceAssignmentCard';
import { ServiceExpenseCard } from './ServiceExpenseCard';
import { ActionButtons } from './ActionButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import type { Product } from "@/lib/firebase-service";
import type { Team } from "@/lib/types/team";
import type { JobOrder } from "@/lib/types/job-order";

// Job Order Details Card Component
function JobOrderDetailsCard({
  jobOrder,
  onChange
}: {
  jobOrder: JobOrder;
  onChange: () => void;
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
        <CardTitle className="flex justify-between items-center">
          <span className="text-2xl font-bold">JOB ORDER</span>
          <Button variant="ghost" size="sm" onClick={onChange}>
            <X className="h-5 w-5" />
          </Button>
        </CardTitle>
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
        <div className="flex items-center">
          <Label className="w-1/2">Booking ID:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.booking_id || "N/A"}</p>
        </div>
        <div className="flex justify-end">
          <Button variant="link" size="sm" onClick={onChange}>Change</Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface FormData {
  projectSite: string;
  serviceType: string;
  assignedTo: string;
  serviceDuration: number;
  priority: string;
  equipmentRequired: string;
  materialSpecs: string;
  crew: string;
  gondola: string;
  technology: string;
  sales: string;
  remarks: string;
  message: string;
  startDate: Date | null;
  endDate: Date | null;
  alarmDate: Date | null;
  alarmTime: string;
  attachments: { name: string; type: string; file?: File }[];
  serviceExpenses: { name: string; amount: string }[];
  serviceCost: {
    crewFee: string;
    overtimeFee: string;
    transpo: string;
    tollFee: string;
    mealAllowance: string;
    otherFees: { name: string; amount: string }[];
    total: number;
  };
}

export function CreateServiceAssignmentForm({
  onSaveAsDraft,
  onSubmit,
  loading,
  companyId,
  productId,
  formData,
  handleInputChange,
  products,
  teams,
  saNumber,
  jobOrderData,
  addExpense,
  removeExpense,
  updateExpense,
  calculateTotal,
  onOpenProductSelection,
  onIdentifyJO,
  onChangeJobOrder,
  onFileUpload,
  onRemoveAttachment,
}: {
  onSaveAsDraft: () => Promise<void>;
  onSubmit: () => Promise<void>;
  loading: boolean;
  companyId: string | null;
  productId: string;
  formData: FormData;
  handleInputChange: (field: string, value: any) => void;
  products: Product[];
  teams: Team[];
  saNumber: string;
  jobOrderData: JobOrder | null;
  addExpense: () => void;
  removeExpense: (index: number) => void;
  updateExpense: (index: number, field: "name" | "amount", value: string) => void;
  calculateTotal: () => number;
  onOpenProductSelection: () => void;
  onIdentifyJO?: () => void;
  onChangeJobOrder?: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment?: (index: number) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row  p-4">
      <div className="flex flex-col gap-6 w-full lg:w-[60%]">
        <ServiceAssignmentCard
          companyId={companyId}
          productId={productId}
          formData={formData}
          handleInputChange={handleInputChange}
          products={products}
          teams={teams}
          saNumber={saNumber}
          jobOrderData={jobOrderData}
          onOpenProductSelection={onOpenProductSelection}
          onFileUpload={onFileUpload}
          onRemoveAttachment={onRemoveAttachment}
        />
      </div>
      <div className="flex flex-col gap-6 w-full lg:w-[40%]">
        {jobOrderData ? (
          <JobOrderDetailsCard
            jobOrder={jobOrderData}
            onChange={onChangeJobOrder || (() => {})}
          />
        ) : (
          onIdentifyJO && (
            <Card className="w-full">
              <CardContent className="flex justify-center items-center p-4">
                <Button variant="outline" className="bg-white text-gray-700 border-gray-300" onClick={onIdentifyJO}>
                  <Search className="h-4 w-4 mr-2" />
                  Identify JO
                </Button>
              </CardContent>
            </Card>
          )
        )}
        <ServiceExpenseCard
          expenses={formData.serviceExpenses}
          addExpense={addExpense}
          removeExpense={removeExpense}
          updateExpense={updateExpense}
          calculateTotal={calculateTotal}
        />
        <ActionButtons onSaveAsDraft={onSaveAsDraft} onSubmit={onSubmit} loading={loading} />
      </div>
    </div>
  );
}
