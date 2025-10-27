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
import { ArrowLeft, Loader2, Upload } from "lucide-react"

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
  const [beforePhotos, setBeforePhotos] = useState<File[]>([])
  const [afterPhotos, setAfterPhotos] = useState<File[]>([])


  const onCreateAReportClick = useCallback(() => {
    router.back()
  }, [router])

  const handleBeforePhotosChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setBeforePhotos(prev => [...prev, ...files])
  }, [])

  const handleAfterPhotosChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAfterPhotos(prev => [...prev, ...files])
  }, [])

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
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onCreateAReportClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create a Report</h1>
        </div>

        {/* Metadata Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
            <div>
              <p className="font-semibold">SA I.D.</p>
              <p>{assignmentData?.saNumber || 'SA000582'}</p>
            </div>
            <div>
              <p className="font-semibold">Type</p>
              <p>{assignmentData?.serviceType || 'Roll Up'}</p>
            </div>
            <div>
              <p className="font-semibold">Site</p>
              <p className="text-blue-600 font-medium">{assignmentData?.projectSiteName || 'Petplans Tower'}</p>
            </div>
            <div>
              <p className="font-semibold">Campaign Name</p>
              <p>{assignmentData?.campaignName || 'Mcdonald\'s'}</p>
            </div>
            <div>
              <p className="font-semibold">Crew</p>
              <p>{assignmentData?.assignedTo || 'Production- Jonathan Dela Cruz'}</p>
            </div>
            <div>
              <p className="font-semibold">Deadline</p>
              <p>{assignmentData?.coveredDateEnd?.toDate?.()?.toLocaleDateString() || 'Oct 18, 2025'}</p>
            </div>
            <div className="flex justify-end items-end">
              <button className="px-4 h-[24px] w-[103px] border border-gray-300 rounded text-sm font-medium hover:bg-gray-50">
                View SA
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row w-full gap-4">
            {/* Left Column - Site Image and Remarks */}
            <div className="space-y-6">
              {/* Site Image */}
              <Image
                src={assignmentData?.siteImage || '/placeholder.jpg'}
                alt="Site"
                width={284} height={190}
                className="object-cover rounded-md"
              />
              {/* Site Info */}
              <div>
                <p className="font-medium">{assignmentData?.projectSiteName || 'Petplans Tower NB'}</p>
                <p className="text-sm text-gray-600">{assignmentData?.projectSiteLocation || 'EDSA, Guadalupe'}</p>
              </div>

              {/* Remarks */}
              <div>
                <textarea
                  className="w-[284px] p-3 border border-[#c4c4c4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter remarks..."
                  aria-label="Remarks"
                />
              </div>
            </div>

            {/* Middle Column - Report Details */}
            <div className="space-y-4 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <p className="text-[18px] font-medium">RPT#{assignmentData?.saNumber || '000582'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">Date:</label>
                  <p className="text-sm">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">SA No.:</label>
                  <p className="text-sm">{assignmentData?.saNumber || 'SA000582'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">SA Type:</label>
                  <p className="text-sm">{assignmentData?.serviceType || 'Roll Up'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">Report Type:</label>
                  <select className="flex-1 p-2 border border-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs">
                    <option value="Service Report">Service Report</option>
                    <option value="Monitoring Report">Monitoring Report</option>
                    <option value="Progress Report">Progress Report</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">Site:</label>
                  <p className="text-sm">{assignmentData?.projectSiteName || 'Petplans Tower NB'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">Campaign Name:</label>
                  <p className="text-sm">{assignmentData?.campaignName || 'Mcdonald\'s'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">Start:</label>
                  <div className="flex gap-2 flex-1">
                    <input
                      type="date"
                      className="flex-1 p-2 border border-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      defaultValue={assignmentData?.coveredDateStart?.toDate?.()?.toISOString().split('T')[0] || ''}
                    />
                    <input
                      type="time"
                      className="flex-1 p-2 border border-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      defaultValue="10:00"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">End:</label>
                  <div className="flex gap-2 flex-1">
                    <input
                      type="date"
                      className="flex-1 p-2 border border-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      defaultValue={assignmentData?.coveredDateEnd?.toDate?.()?.toISOString().split('T')[0] || ''}
                    />
                    <input
                      type="time"
                      className="flex-1 p-2 border border-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      defaultValue="10:00"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">Crew:</label>
                  <input
                    type="text"
                    className="flex-1 p-2 border border-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                    defaultValue={assignmentData?.assignedTo || ''}
                    placeholder="Enter crew name"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold min-w-[120px]">Status:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-20 p-2 border border-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      defaultValue={assignmentData?.status === "Completed" ? 100 : 50}
                    />
                    <span className="text-sm text-gray-600">of 100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Photo Uploads */}
            <div className="space-y-6 flex-1">
              {/* Before SA Photos */}
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-3 leading-[100%]">Before SA Photos:</h4>
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="mb-4">
                    {beforePhotos.length > 0 ? (
                      <div className="flex items-start gap-4 overflow-x-auto pb-2 min-w-0">
                        {/* Image Previews */}
                        <div className="flex gap-2 flex-shrink-0">
                          {beforePhotos.map((file, index) => (
                            <div key={index} className="relative flex-shrink-0">
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Before photo ${index + 1}`}
                                width={96}
                                height={96}
                                className="w-24 h-24 object-cover rounded border"
                              />
                              <button
                                onClick={() => setBeforePhotos(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                aria-label="Remove photo"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0 ml-auto">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            id="before-photos"
                            onChange={handleBeforePhotosChange}
                            aria-label="Upload before SA photos"
                          />
                          <label
                            htmlFor="before-photos"
                            className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                          >
                            <Upload className="w-8 h-8 text-gray-400 mb-1" />
                            <div className="text-gray-500 text-xs text-center">Upload</div>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id="before-photos"
                          onChange={handleBeforePhotosChange}
                          aria-label="Upload before SA photos"
                        />
                        <label
                          htmlFor="before-photos"
                          className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-1" />
                          <div className="text-gray-500 text-xs text-center">Upload</div>
                        </label>
                      </div>
                    )}
                  </div>

                  <textarea
                    className="w-24 p-2 border border-[#c4c4c4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    rows={1}
                    placeholder="Add note..."
                    aria-label="Before SA Photos Note"
                  />
                </div>
              </div>

              {/* After SA Photos */}
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-3 leading-[100%]">After SA Photos:</h4>
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="mb-4">
                    {afterPhotos.length > 0 ? (
                      <div className="flex items-start gap-4 overflow-x-auto pb-2 min-w-0">
                        {/* Image Previews */}
                        <div className="flex gap-2 flex-shrink-0">
                          {afterPhotos.map((file, index) => (
                            <div key={index} className="relative flex-shrink-0">
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`After photo ${index + 1}`}
                                width={96}
                                height={96}
                                className="w-24 h-24 object-cover rounded border"
                              />
                              <button
                                onClick={() => setAfterPhotos(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                aria-label="Remove photo"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0 ml-auto">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            id="after-photos"
                            onChange={handleAfterPhotosChange}
                            aria-label="Upload after SA photos"
                          />
                          <label
                            htmlFor="after-photos"
                            className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                          >
                            <Upload className="w-8 h-8 text-gray-400 mb-1" />
                            <div className="text-gray-500 text-xs text-center">Upload</div>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id="after-photos"
                          onChange={handleAfterPhotosChange}
                          aria-label="Upload after SA photos"
                        />
                        <label
                          htmlFor="after-photos"
                          className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-1" />
                          <div className="text-gray-500 text-xs text-center">Upload</div>
                        </label>
                      </div>
                    )}
                  </div>

                  <textarea
                    className="w-24 p-2 border border-[#c4c4c4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    rows={1}
                    placeholder="Add note..."
                    aria-label="After SA Photos Note"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-center align-center">
          <div className="rounded-[50px] shadow-md p-2 bg-white h-[67px] flex items-center justify-center w-[346px]">
            <div className="flex gap-2 align-center">
              <button className="px-4 text-gray-700 rounded-lg underline hover:bg-gray-50 font-semibold transition-colors text-sm">
                Save as Draft
              </button>
              <button
                onClick={createReportFromAssignment}
                disabled={creatingReport}
                className="bg-[#1d0beb] h-[27px] w-[159px] text-xs text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
      </div>
    </div>
  )
}