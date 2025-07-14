"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import AllSitesTab from "./all-sites"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"
import { useRouter } from "next/navigation"

export default function LogisticsDashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showReportSuccessDialog, setShowReportSuccessDialog] = useState(false)
  const [lastPostedReportId, setLastPostedReportId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const reportId = sessionStorage.getItem("lastPostedReportId")
    if (reportId) {
      setLastPostedReportId(reportId)
      setShowReportSuccessDialog(true)
      sessionStorage.removeItem("lastPostedReportId") // Clear it so it doesn't show again
    }
  }, [])

  return (
    <div className="flex-1 overflow-auto relative">
      <main className="p-4">
        <div className="flex flex-col gap-4">
          {/* Main Content - All Sites */}
          <AllSitesTab />
        </div>
      </main>

      {/* Report Post Success Dialog */}
      {showReportSuccessDialog && lastPostedReportId && (
        <ReportPostSuccessDialog
          open={showReportSuccessDialog}
          onOpenChange={setShowReportSuccessDialog}
          reportId={lastPostedReportId}
          onViewReport={(id) => router.push(`/logistics/reports/${id}`)}
        />
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-10">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg h-14 px-6"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" /> Create Service Assignment
        </Button>
      </div>

      {/* Service Assignment Dialog */}
      <ServiceAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          // You could add a success toast notification here
        }}
      />
    </div>
  )
}
