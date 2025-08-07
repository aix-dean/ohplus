import { Card } from "@/components/ui/card";
import { ITUserManagement } from "@/components/it/it-user-management";

export default function ITUserManagementPage() {
  return (
    <div>
      <Card>
        <div className="p-4">
          <ITUserManagement />
        </div>
      </Card>
    </div>
  );
}
