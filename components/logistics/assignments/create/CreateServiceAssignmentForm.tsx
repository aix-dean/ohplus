import { ServiceAssignmentCard } from './ServiceAssignmentCard';
import { ServiceExpenseCard } from './ServiceExpenseCard';
import { ActionButtons } from './ActionButtons';

export function CreateServiceAssignmentForm({
  onSaveAsDraft,
  onSubmit,
  loading,
}: {
  onSaveAsDraft: () => Promise<void>;
  onSubmit: () => Promise<void>;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      <div className="flex flex-col gap-6 w-full lg:w-[70%]">
        <ServiceAssignmentCard />
      </div>
      <div className="flex flex-col gap-6 w-full lg:w-[30%]">
        <ServiceExpenseCard />
        <ActionButtons onSaveAsDraft={onSaveAsDraft} onSubmit={onSubmit} loading={loading} />
      </div>
    </div>
  );
}