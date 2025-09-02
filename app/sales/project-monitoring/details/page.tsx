"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"

export default function JobOrderDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get job order information from URL parameters
  const jobOrderId = searchParams.get("id")
  const jobOrderNumber = searchParams.get("number")
  const siteName = searchParams.get("site")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header with back navigation */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Job Order Details</h1>
          </div>
        </header>

        {/* Main content area - initially blank but structured */}
        <main className="space-y-6">
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {jobOrderNumber ? `Job Order ${jobOrderNumber}` : "Job Order Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Job Order Details</h3>
                <p className="text-gray-600 mb-4">Detailed information for this job order will be displayed here.</p>
                {jobOrderId && (
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Job Order ID: {jobOrderId}</p>
                    {jobOrderNumber && <p>Job Order Number: {jobOrderNumber}</p>}
                    {siteName && <p>Site: {siteName}</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
