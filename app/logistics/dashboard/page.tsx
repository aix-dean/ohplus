"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search } from "lucide-react"
import { AllSites } from "./all-sites"
import { StaticSites } from "./static-sites"
import { LedSites } from "./led-sites"
import { CreateReportDialog } from "@/components/create-report-dialog"
import { ReportPostedSuccessDialog } from "@/components/report-posted-success-dialog" // Import the new dialog

export default function DashboardPage() {
  const [isCreateReportDialogOpen, setIsCreateReportDialogOpen] = useState(false)
  const [isReportPostedSuccessDialogOpen, setIsReportPostedSuccessDialogOpen] = useState(false) // New state for success dialog
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for the query parameter when the component mounts
    if (searchParams.get("reportPosted") === "true") {
      setIsReportPostedSuccessDialogOpen(true)
      // Remove the query parameter from the URL to prevent the dialog from showing again on refresh
      router.replace("/logistics/dashboard", undefined)
    }
  }, [searchParams, router])

  const handleViewDashboard = () => {
    setIsReportPostedSuccessDialogOpen(false)
    // Optionally, navigate to a clean dashboard URL if needed, though replace already cleans it
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Logistics Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button onClick={() => setIsCreateReportDialogOpen(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Report
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <Tabs defaultValue="all-sites" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-sites">All Sites</TabsTrigger>
            <TabsTrigger value="static-sites">Static Sites</TabsTrigger>
            <TabsTrigger value="led-sites">LED Sites</TabsTrigger>
          </TabsList>
          <TabsContent value="all-sites">
            <Card>
              <CardHeader>
                <CardTitle>All Sites Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <AllSites />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="static-sites">
            <Card>
              <CardHeader>
                <CardTitle>Static Sites Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <StaticSites />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="led-sites">
            <Card>
              <CardHeader>
                <CardTitle>LED Sites Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <LedSites />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <CreateReportDialog isOpen={isCreateReportDialogOpen} onClose={() => setIsCreateReportDialogOpen(false)} />

      <ReportPostedSuccessDialog
        open={isReportPostedSuccessDialogOpen}
        onOpenChange={setIsReportPostedSuccessDialogOpen}
        onViewDashboard={handleViewDashboard}
      />
    </div>
  )
}
