"use client"

import React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import Image from "next/image";
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { createReport, ReportData } from "@/lib/report-service"
import { Timestamp } from "firebase/firestore"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function CreateReportPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const assignmentId = params.id as string

  const [assignmentData, setAssignmentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingReport, setCreatingReport] = useState(false)
  const [reportCreated, setReportCreated] = useState(false)


  const onCreateAReportClick = useCallback(() => {
    router.back()
  }, [router])

  const createReportFromAssignment = useCallback(async () => {
    if (!assignmentData || !user) return

    setCreatingReport(true)
    setError(null)

    try {
      // Map service assignment data to report data
      const reportData: ReportData = {
        siteId: assignmentData.projectSiteId || "",
        siteName: assignmentData.projectSiteName || "",
        companyId: assignmentData.company_id || "",
        sellerId: user.uid,
        client: assignmentData.requestedBy?.name || "",
        clientId: assignmentData.requestedBy?.id || "",
        joNumber: assignmentData.saNumber || "",
        joType: assignmentData.serviceType || "",
        bookingDates: {
          start: assignmentData.coveredDateStart || Timestamp.now(),
          end: assignmentData.coveredDateEnd || Timestamp.now(),
        },
        breakdate: assignmentData.coveredDateStart || Timestamp.now(),
        sales: assignmentData.requestedBy?.name || "",
        reportType: assignmentData.serviceType === "Monitoring" ? "Monitoring Report" : "Service Report",
        date: new Date().toISOString().split('T')[0],
        attachments: assignmentData.attachments?.map((att: any) => ({
          note: att.name || "",
          fileName: att.name || "attachment",
          fileType: att.type || "unknown",
          fileUrl: "",
          label: att.name || "",
        })) || [],
        status: "draft",
        createdBy: user.uid,
        createdByName: user.email || "",
        category: "Service",
        subcategory: assignmentData.serviceType || "General",
        priority: assignmentData.priority || "Medium",
        completionPercentage: assignmentData.status === "Completed" ? 100 : 50,
        tags: [assignmentData.serviceType || "service"],
        assignedTo: assignmentData.assignedTo || "",
        location: assignmentData.projectSiteLocation || "",
      }

      // Add optional fields if they exist
      if (assignmentData.campaignName) {
        reportData.client = assignmentData.campaignName
      }

      if (assignmentData.remarks) {
        reportData.descriptionOfWork = assignmentData.remarks
      }

      console.log("Creating report with data:", reportData)

      const reportId = await createReport(reportData)
      console.log("Report created successfully with ID:", reportId)

      setReportCreated(true)

      // Navigate to the created report or back to reports list
      setTimeout(() => {
        router.push("/logistics/reports")
      }, 2000)

    } catch (err) {
      console.error("Error creating report:", err)
      setError("Failed to create report. Please try again.")
    } finally {
      setCreatingReport(false)
    }
  }, [assignmentData, user, router])

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData()
    } else {
      setError("No assignment ID provided")
      setLoading(false)
    }
  }, [assignmentId])

  const fetchAssignmentData = useCallback(async () => {
    if (!assignmentId) return

    try {
      setLoading(true)
      setError(null)

      const assignmentDoc = await getDoc(doc(db, "service_assignments", assignmentId))

      if (assignmentDoc.exists()) {
        const data = { id: assignmentDoc.id, ...assignmentDoc.data() }
        setAssignmentData(data)
      } else {
        setError("Assignment not found")
      }
    } catch (err) {
      console.error("Error fetching assignment:", err)
      setError("Failed to load assignment data")
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading assignment data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <button
            onClick={() => router.push("/logistics/reports/select-service-assignment")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Select Service Assignment
          </button>
        </div>
      </div>
    )
  }

  if (reportCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-600 text-lg font-medium mb-4">
            ✓ Report created successfully!
          </div>
          <p className="text-gray-600 mb-4">Redirecting to reports list...</p>
          <button
            onClick={() => router.push("/logistics/reports")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Reports
          </button>
        </div>
      </div>
    )
  }

  if (!assignmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No assignment data available</p>
          <button
            onClick={() => router.push("/logistics/reports/select-service-assignment")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Select Service Assignment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full bg-gray-50">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onCreateAReportClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create a Report</h1>
        </div>
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 h-[60px]">
          {/* Metadata Row */}
          <div className="flex justify-between items-start w-full">
            <div>
              <p className="text-sm font-semibold">SA ID</p>
              <p className="text-xs">{assignmentData?.saNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Type</p>
              <p className="text-xs">{assignmentData?.serviceType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Site</p>
              <p className="text-xs">{assignmentData?.projectSiteName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Campaign</p>
              <p className="text-xs">{assignmentData?.campaignName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Crew</p>
              <p className="text-xs">{assignmentData?.assignedTo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Deadline</p>
              <p className="text-xs">
                {assignmentData?.coveredDateEnd?.toDate?.()?.toLocaleDateString() || 'N/A'}
              </p>
            </div>
            <button
              className="w-[103px] h-[24px] relative rounded-[5px] text-xs border-[#c4c4c4] leading-[100%] font-semibold border-[2px] box-border"
            >
              View SA
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* First Column - Site Image and Remarks */}
            <div className="space-y-6">
              {/* Site Image */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={assignmentData?.siteImage || '/placeholder.jpg'}
                  alt="Site"
                  width={400}
                  height={225}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter remarks..."
                  value={assignmentData?.remarks || ''}
                  readOnly
                  aria-label="Remarks"
                />
              </div>
            </div>

            {/* Second Column - Report Details */}
            <div className="space-y-6">
              {/* Report Details */}
              <div className="space-y-4">
                <div className='flex'>
                  <label className="block text-sm font-semibold mb-1">Report Number</label>
                  <p className="font-medium">RPT#{assignmentData?.saNumber || '000582'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold whitespace-nowrap">Date:</label>
                  <input
                    type="date"
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="time"
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="10:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">SA No.</label>
                  <p className="font-medium">{assignmentData?.saNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">SA Type</label>
                  <p className="font-medium">{assignmentData?.serviceType || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Report Type</label>
                  <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="Service Report">Service Report</option>
                    <option value="Monitoring Report">Monitoring Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Site</label>
                  <p className="font-medium">{assignmentData?.projectSiteName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Campaign Name</label>
                  <p className="font-medium">{assignmentData?.campaignName || 'N/A'}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={assignmentData?.coveredDateStart?.toDate?.()?.toISOString().split('T')[0] || ''}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-1">Start Time</label>
                    <input
                      type="time"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue="10:00"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={assignmentData?.coveredDateEnd?.toDate?.()?.toISOString().split('T')[0] || ''}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-1">End Time</label>
                    <input
                      type="time"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue="10:00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Crew</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={assignmentData?.assignedTo || ''}
                    placeholder="Enter crew name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Status</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={assignmentData?.status === "Completed" ? 100 : 50}
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Third Column - Photo Uploads */}
            <div className="space-y-6">
              {/* Before SA Photos */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Before SA Photos</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4">
                  <div className="text-gray-500 mb-2">No photos uploaded</div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Upload Photos
                  </button>
                </div>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add note..."
                  aria-label="Before SA Photos Note"
                />
              </div>

              {/* After SA Photos */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">After SA Photos</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4">
                  <div className="text-gray-500 mb-2">No photos uploaded</div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Upload Photos
                  </button>
                </div>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add note..."
                  aria-label="After SA Photos Note"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Save as Draft
          </button>
          <button
            onClick={createReportFromAssignment}
            disabled={creatingReport}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Generate Report"
          >
            {creatingReport ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              'Generate Report'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}