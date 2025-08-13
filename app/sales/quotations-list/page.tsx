import { Suspense } from "react"
import { QuotationsListContent } from "@/components/quotations-list-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
  searchParams: {
    page?: string
    search?: string
    status?: string
  }
}

export default function SalesQuotationsPage({ searchParams }: PageProps) {
  const currentPage = Number(searchParams.page) || 1
  const searchQuery = searchParams.search || ""
  const statusFilter = searchParams.status || ""

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <Card className="border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-900">Quotations List</CardTitle>
          </CardHeader>
          <Suspense fallback={<QuotationsListSkeleton />}>
            <QuotationsListContent currentPage={currentPage} searchQuery={searchQuery} statusFilter={statusFilter} />
          </Suspense>
        </Card>
      </div>
    </div>
  )
}

function QuotationsListSkeleton() {
  return (
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded-md flex-1 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-md w-32 animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
            ))}
        </div>
      </div>
    </CardContent>
  )
}
