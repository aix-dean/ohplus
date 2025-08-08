import { SalesRecordTable } from "@/components/accounting/sales-record-table"
import { Card, CardContent } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="mx-auto w-full p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Accounting — Sales Record</h1>
        <p className="text-sm text-muted-foreground">Manage sales records. Edit rows using the button at the end of each row.</p>
      </div>

      <div className="space-y-4">
        <SalesRecordTable />

        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Notes:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Output VAT = Net Sales × 0.12</li>
              <li>Total = Net Sales + Output VAT</li>
              <li>Creditable Tax = Net Sales × 0.02</li>
              <li>Amount Collected = Invoice Amount − Creditable Tax (Invoice Amount assumed to be Total)</li>
              <li>Use Save to persist to your browser. Load Mock Data to restore example entries.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
