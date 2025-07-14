"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AllSites } from "./all-sites"
import { LedSites } from "./led-sites"
import { StaticSites } from "./static-sites"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LogisticsDashboardPage() {
  const [showReportSuccessDialog, setShowReportSuccessDialog] = useState(false)
  const [postedReportId, setPostedReportId] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check if a report was just posted successfully
    const reportPosted = sessionStorage.getItem("reportPostedSuccess")
    const reportId = sessionStorage.getItem("postedReportId")

    if (reportPosted === "true" && reportId) {
      setPostedReportId(reportId)
      setShowReportSuccessDialog(true)
      // Clear the sessionStorage items to prevent the dialog from showing again
      sessionStorage.removeItem("reportPostedSuccess")
      sessionStorage.removeItem("postedReportId")
    }
  }, [])

  const handleViewReport = (id: string) => {
    router.push(`/logistics/reports/${id}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4 md:p-8">
      <Card className="w-full max-w-7xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800">Logistics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all-sites" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all-sites">All Sites</TabsTrigger>
              <TabsTrigger value="led-sites">LED Sites</TabsTrigger>
              <TabsTrigger value="static-sites">Static Sites</TabsTrigger>
            </TabsList>
            <TabsContent value="all-sites">
              <AllSites />
            </TabsContent>
            <TabsContent value="led-sites">
              <LedSites />
            </TabsContent>
            <TabsContent value="static-sites">
              <StaticSites />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ReportPostSuccessDialog
        open={showReportSuccessDialog}
        onOpenChange={setShowReportSuccessDialog}
        reportId={postedReportId}
        onViewReport={handleViewReport}
      />
    </div>
  )
}
