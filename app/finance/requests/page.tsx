import RequestsView from '@/components/finance/requests-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FinanceRequestsPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance Requests</h1>
            <p className="text-muted-foreground">
                Manage and review reimbursement and requisition requests.
            </p>
        </div>
        <RequestsView />
    </div>
  );
}
