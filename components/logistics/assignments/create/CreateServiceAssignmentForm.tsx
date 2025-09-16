import { ServiceAssignmentCard } from './ServiceAssignmentCard';
import { ServiceExpenseCard } from './ServiceExpenseCard';
import { ActionButtons } from './ActionButtons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
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
  serviceExpenses: { name: string; amount: string }[];
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
        {onIdentifyJO && (
          <Card className="w-full">
            <CardContent className="flex justify-center items-center p-4">
              <Button variant="outline" className="bg-white text-gray-700 border-gray-300" onClick={onIdentifyJO}>
                <Search className="h-4 w-4 mr-2" />
                Identify JO
              </Button>
            </CardContent>
          </Card>
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