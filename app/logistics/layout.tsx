"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SideNavigation } from "@/components/side-navigation"
import { TopNavigation } from "@/components/top-navigation"
import { ReportPostedSuccessDialog } from "@/components/report-posted-success-dialog" // Import the new dialog

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showReportSuccessDialog, setShowReportSuccessDialog] = useState(false) // State for the new dialog

  useEffect(() => {
    // Check session storage for the flag to show the success dialog
    if (pathname === "/logistics/dashboard") {
      const showDialog = sessionStorage.getItem("showReportSuccessDialog")
      if (showDialog === "true") {
        setShowReportSuccessDialog(true)
        sessionStorage.removeItem("showReportSuccessDialog") // Clear the flag
      }
    }
  }, [pathname])

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <SideNavigation isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <TopNavigation onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">{children}</main>
      </div>
      {/* Render the new success dialog */}
      <ReportPostedSuccessDialog open={showReportSuccessDialog} onOpenChange={setShowReportSuccessDialog} />
    </div>
  )
}
