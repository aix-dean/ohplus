import { SalesRecordTable } from "@/components/accounting/sales-record-table"

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Accounting</span>
              <span>/</span>
              <span>Sales Record</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Sales Record Management
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Track and manage your sales records with automated calculations for VAT, taxes, and collections. 
              All data is stored locally in your browser.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <SalesRecordTable />
          
          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-lg mb-4 text-foreground">Calculation Rules</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Output VAT:</span>
                  <span className="font-mono">Net Sales × 12%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-mono">Net Sales + Output VAT</span>
                </div>
                <div className="flex justify-between">
                  <span>Creditable Tax:</span>
                  <span className="font-mono">Net Sales × 2%</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Collected:</span>
                  <span className="font-mono">Total - Creditable Tax</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-lg mb-4 text-foreground">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Click the edit button to modify any row</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>All calculations update automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use search to filter records quickly</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Remember to save your changes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
