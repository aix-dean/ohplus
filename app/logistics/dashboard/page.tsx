"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AllSites } from "./all-sites"
import { StaticSites } from "./static-sites"
import { LedSites } from "./led-sites"
import { ReportPostSuccessDialog } from "@/components/report-post-success-dialog"
import { useRouter } from "next/navigation"

export default function LogisticsDashboardPage() {
  const [activeTab, setActiveTab] = useState("all-sites")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [postedReportId, setPostedReportId] = useState("")
  const router = useRouter()

  useEffect(() => {
    const id = sessionStorage.getItem("postedReportId")
    if (id) {
      setPostedReportId(id)
      setShowSuccessDialog(true)
      sessionStorage.removeItem("postedReportId") // Clear it after reading
    }
  }, [])

  const handleViewReport = (id: string) => {
    router.push(`/logistics/reports/${id}`)
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-background border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logistics Dashboard</h1>
        <Button>Create New Report</Button>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <TruckIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <MegaphoneIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">+15.3% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
              <ClipboardListIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">-5.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
              <FileTextIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">456</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">+8.7% from last month</p>
            </CardContent>
          </Card>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-sites">All Sites</TabsTrigger>
            <TabsTrigger value="static-sites">Static Sites</TabsTrigger>
            <TabsTrigger value="led-sites">LED Sites</TabsTrigger>
          </TabsList>
          <TabsContent value="all-sites">
            <AllSites />
          </TabsContent>
          <TabsContent value="static-sites">
            <StaticSites />
          </TabsContent>
          <TabsContent value="led-sites">
            <LedSites />
          </TabsContent>
        </Tabs>
      </main>
      {showSuccessDialog && (
        <ReportPostSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          reportId={postedReportId}
          onViewReport={handleViewReport}
        />
      )}
    </div>
  )
}

function ClipboardListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 2v4" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <line x1="8" x2="16" y1="10" y2="10" />
      <line x1="8" x2="16" y1="14" y2="14" />
    </svg>
  )
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}

function MegaphoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 11 18-2v7l-18 2V11Z" />
      <path d="M7 11V7" />
      <path d="M11 7v3" />
      <path d="M15 7v3" />
      <path d="M19 7v3" />
    </svg>
  )
}

function TruckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M10 18H7l1.76-4.47a1 1 0 0 1 .72-.73l4.7-.78c.74-.12 1.26-.64 1.48-1.34l.74-2.96A1 1 0 0 0 19 5h3v4.5" />
      <path d="M18 18h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  )
}
