"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, Download, Send, Eye, Share, Printer } from "lucide-react"
import { getReportById, updateReport, type ReportData } from "@/lib/report-service"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SendReportDialog } from "@/components/send-report-dialog"
import { useToast } from "@/hooks/use-toast"

export default function ReportReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const reportId = params.id as string
  const [logisticsReportUrl, setLogisticsReportUrl] = useState<string | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [crewName, setCrewName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)

  useEffect(() => {
    if (reportId) {
      fetchLogisticsReport()
    }
  }, [reportId])

  const fetchLogisticsReport = async () => {
    try {
      console.log("[ReportReviewPage] Fetching report for ID:", reportId);
      const report = await getReportById(reportId);
      console.log("[ReportReviewPage] Fetched report:", report);
      setReportData(report);
      if (report?.logistics_report) {
        console.log("[ReportReviewPage] Found logistics_report URL:", report.logistics_report);
        setLogisticsReportUrl(report.logistics_report);
      } else {
        console.log("[ReportReviewPage] No logistics_report URL found in report.");
        setLogisticsReportUrl(null);
      }

      // Fetch crew name from logistics_teams collection
      const crewId = report?.assignedTo || report?.crew
      if (crewId) {
        try {
          const teamDoc = await getDoc(doc(db, "logistics_teams", crewId))
          if (teamDoc.exists()) {
            const teamData = teamDoc.data()
            setCrewName(teamData.name || null)
          } else {
            setCrewName(null)
          }
        } catch (crewError) {
          console.error("Error fetching crew name:", crewError)
          setCrewName(null)
        }
      } else {
        setCrewName(null)
      }
    } catch (error) {
      console.error("[ReportReviewPage] Error fetching logistics report:", error);
      setError("Failed to load logistics report");
    } finally {
      setLoading(false);
      console.log("[ReportReviewPage] Loading finished. logisticsReportUrl:", logisticsReportUrl);
      console.log("[ReportReviewPage] Error state:", error);
    }
  }

  const handleBack = () => {
    router.back()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleShare = () => {
    if (navigator.share && logisticsReportUrl) {
      navigator.share({
        title: 'Logistics Report',
        text: 'Check out this logistics report',
        url: window.location.href
      })
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }
  const handlePrint = async (e: React.MouseEvent) => {
    e?.stopPropagation();
    if (!logisticsReportUrl) return;

    try {
      const response = await fetch(logisticsReportUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Failed to print:", error);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!reportData?.id) return;

    try {
      await updateReport(reportData.id, { status: "draft" });
      toast({
        title: "Report saved as draft",
        description: "The report has been saved as a draft successfully.",
      });
    } catch (error) {
      console.error("Failed to save as draft:", error);
      toast({
        title: "Failed to save draft",
        description: "There was an error saving the report as draft.",
        variant: "destructive",
      });
    }
  };

  const handleSendReport = () => {
    setIsSendDialogOpen(true);
  };

  const handleSendOptionSelect = (option: "email" | "whatsapp" | "viber" | "messenger") => {
    // Handle the selected send option
    console.log("Selected send option:", option);
    setIsSendDialogOpen(false);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading logistics report...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-4 px-4">
          <button
            onClick={handleBack}
            className="text-[#333] flex items-center hover:text-gray-800 hover:bg-gray-100 rounded-full p-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <h1 className="text-sm font-semibold text-gray-900 ml-2">Review Report</h1>
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-4 p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Report</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-gray-600 hover:text-gray-800"
            >
              Refresh Page
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setError(null)
                setLoading(true)
                fetchLogisticsReport()
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Retry Loading
            </Button>
          </div>
        </div>
      ) : logisticsReportUrl ? (
        <div className="w-full" style={{ height: 'calc(100vh - 80px)' }}>
          <iframe
            src={`${logisticsReportUrl}#zoom=110&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0 bg-white"
            title="Logistics Report PDF"
            onLoad={() => console.log('PDF iframe loaded successfully')}
            onError={() => console.log('PDF iframe failed to load')}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-4 p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">PDF Not Available</h3>
            <p className="mt-1 text-sm text-gray-500">
              No logistics report PDF is configured for this report.
              {reportId && ` (Report ID: ${reportId})`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">
              PDF will be available when the logistics report is generated.
            </p>
          </div>
        </div>
      )}

      {/* Fixed Bottom Buttons */}
      {logisticsReportUrl && reportData && (
        <div className="fixed bottom-6 left-1/2 transform-translate-x-1/2 z-50 bg-white w-[346px] h-[67px] p-[1.5px] flex items-center justify-center rounded-full shadow-lg border border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={handleSaveAsDraft}
              className="underline font-bold"
            >
              Save as Draft
            </button>
            <button
              onClick={handleSendReport}
              className="bg-[#1d0beb] text-white font-bold w-[159px] h-[27px] rounded-[10px]"
            >
              Send Report
            </button>
          </div>
        </div>
      )}

      {/* Send Report Dialog */}
      {reportData && (
        <SendReportDialog
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          report={reportData}
          onSelectOption={handleSendOptionSelect}
        />
      )}
    </div>
  )
}