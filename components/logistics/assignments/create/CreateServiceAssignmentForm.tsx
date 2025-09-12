import { ServiceAssignmentCard } from './ServiceAssignmentCard';
import { ServiceExpenseCard } from './ServiceExpenseCard';
import { ActionButtons } from './ActionButtons';
import type { Product } from "@/lib/firebase-service";
import type { Team } from "@/lib/types/team";
import type { JobOrder } from "@/lib/types/job-order";

interface FormData {
  projectSite: string;
  serviceType: string;
  assignedTo: string;
  serviceDuration: number;
  priority: string;
  equipmentRequired: string;
  materialSpecs: string;
  crew: string;
  illuminationNits: string;
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
  handleServiceCostChange,
  addOtherFee,
  removeOtherFee,
  updateOtherFee,
  calculateServiceCostTotal,
  onOpenProductSelection,
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
  handleServiceCostChange: (field: string, value: string) => void;
  addOtherFee: () => void;
  removeOtherFee: (index: number) => void;
  updateOtherFee: (index: number, field: "name" | "amount", value: string) => void;
  calculateServiceCostTotal: () => number;
  onOpenProductSelection: () => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      <div className="flex flex-col gap-6 w-full lg:w-[70%]">
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
        />
      </div>
      <div className="flex flex-col gap-6 w-full lg:w-[30%]">
        <ServiceExpenseCard
          serviceCost={formData.serviceCost}
          handleServiceCostChange={handleServiceCostChange}
          addOtherFee={addOtherFee}
          removeOtherFee={removeOtherFee}
          updateOtherFee={updateOtherFee}
          calculateServiceCostTotal={calculateServiceCostTotal}
        />
        <ActionButtons onSaveAsDraft={onSaveAsDraft} onSubmit={onSubmit} loading={loading} />
      </div>
    </div>
  );
}
