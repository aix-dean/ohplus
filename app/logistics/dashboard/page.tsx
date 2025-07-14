"use client"

import { useState, useEffect } from "react"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"

export default function LogisticsDashboardPage() {
  const [showReportSuccessDialog, setShowReportSuccessDialog] = useState(false)

  useEffect(() => {
    const reportPosted = sessionStorage.getItem("reportPostedSuccess")
    if (reportPosted) {
      setShowReportSuccessDialog(true)
      sessionStorage.removeItem("reportPostedSuccess") // Clear the flag
    }
  }, [])

  return (
    <div>
      <h1>Logistics Dashboard</h1>
      {/* Report Post Success Dialog */}
      <ReportPostSuccessDialog isOpen={showReportSuccessDialog} onClose={() => setShowReportSuccessDialog(false)} />
    </div>
  )
}
