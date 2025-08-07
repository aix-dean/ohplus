import RequestsView from '@/components/finance/requests-view';

export default function FinanceRequestsPage() {
  return (
    <div className="space-y-6">
        <div>
            <p className="text-muted-foreground">
                Manage and review reimbursement and requisition requests.
            </p>
        </div>
        <RequestsView />
    </div>
  );
}
