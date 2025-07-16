"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import Image from "next/image"
import jsPDF from "jspdf"
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  FileText,
  AlertCircle,
  Package,
  Edit,
  UserCheck,
  RefreshCw,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getJobOrderById } from "@/lib/job-order-service"
import type { JobOrder } from "@/lib/types/job-order"

// Helper function to load image and convert to base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Error loading image:", error)
    return null
  }
}

// Helper function to get image dimensions
function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      resolve({ width: 100, height: 100 }) // Default dimensions
    }
    img.src = base64
  })
}

// Helper function to safely convert to Date
function safeToDate(dateValue: any): Date {
  if (dateValue instanceof Date) {
    return dateValue
  }
  if (typeof dateValue === "string" || typeof dateValue === "number") {
    return new Date(dateValue)
  }
  if (dateValue && typeof dateValue.toDate === "function") {
    return dateValue.toDate()
  }
  return new Date() // fallback to current date
}

export default function JobOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  const jobOrderId = params.id as string

  useEffect(() => {
    const fetchJobOrder = async () => {
      try {
        setLoading(true)
        const fetchedJobOrder = await getJobOrderById(jobOrderId)
        if (fetchedJobOrder) {
          setJobOrder(fetchedJobOrder)
        } else {
          setError("Job order not found.")
        }
      } catch (err) {
        console.error("Failed to fetch job order:", err)
        setError("Failed to load job order details.")
      } finally {
        setLoading(false)
      }
    }

    if (jobOrderId) {
      fetchJobOrder()
    }
  }, [jobOrderId])

  const generateJobOrderPDF = async (jobOrder: JobOrder) => {
    try {
      setIsPrinting(true)

      // Create new PDF document
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - margin * 2
      let yPosition = margin

      // Safely convert dates
      const createdAt = safeToDate(jobOrder.createdAt)
      const dateRequested = safeToDate(jobOrder.dateRequested)
      const deadline = safeToDate(jobOrder.deadline)

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
        pdf.setFontSize(fontSize)
        const lines = pdf.splitTextToSize(text, maxWidth)
        pdf.text(lines, x, y)
        return y + lines.length * fontSize * 0.3
      }

      // Helper function to check if we need a new page
      const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin - 20) {
          pdf.addPage()
          yPosition = margin
        }
      }

      // Modern Header with gradient-like effect using rectangles
      pdf.setFillColor(30, 58, 138) // Dark blue
      pdf.rect(0, 0, pageWidth, 25, "F")

      pdf.setFillColor(59, 130, 246) // Lighter blue
      pdf.rect(0, 20, pageWidth, 5, "F")

      // Header text
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(20)
      pdf.setFont("helvetica", "bold")
      pdf.text("JOB ORDER", margin, 15)

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(`#${jobOrder.joNumber}`, pageWidth - margin - 40, 15)

      yPosition = 35
      pdf.setTextColor(0, 0, 0)

      // Job Order Information Card
      pdf.setFillColor(248, 250, 252) // Light gray background
      pdf.rect(margin, yPosition, contentWidth, 45, "F")
      pdf.setLineWidth(0.5)
      pdf.setDrawColor(226, 232, 240)
      pdf.rect(margin, yPosition, contentWidth, 45)

      yPosition += 8

      // Job Order Title
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text(jobOrder.siteName || "Job Order", margin + 5, yPosition)
      yPosition += 8

      // Status Badge
      const statusColors = {
        completed: { bg: [34, 197, 94], text: [255, 255, 255] },
        "in-progress": { bg: [59, 130, 246], text: [255, 255, 255] },
        pending: { bg: [245, 158, 11], text: [255, 255, 255] },
        cancelled: { bg: [239, 68, 68], text: [255, 255, 255] },
      }

      const statusColor = statusColors[jobOrder.status as keyof typeof statusColors] || statusColors.pending
      pdf.setFillColor(...statusColor.bg)
      pdf.rect(margin + 5, yPosition - 2, 25, 6, "F")
      pdf.setTextColor(...statusColor.text)
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "bold")
      pdf.text(jobOrder.status.toUpperCase(), margin + 7, yPosition + 2)
      pdf.setTextColor(0, 0, 0)

      // Job Type Badge
      const typeColors = {
        installation: { bg: [59, 130, 246], text: [255, 255, 255] },
        maintenance: { bg: [245, 158, 11], text: [255, 255, 255] },
        repair: { bg: [239, 68, 68], text: [255, 255, 255] },
        dismantling: { bg: [107, 114, 128], text: [255, 255, 255] },
      }

      const typeColor = typeColors[jobOrder.joType?.toLowerCase() as keyof typeof typeColors] || typeColors.installation
      pdf.setFillColor(...typeColor.bg)
      pdf.rect(margin + 35, yPosition - 2, 30, 6, "F")
      pdf.setTextColor(...typeColor.text)
      pdf.text(jobOrder.joType.toUpperCase(), margin + 37, yPosition + 2)
      pdf.setTextColor(0, 0, 0)

      yPosition += 10

      // Key Information in two columns
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")

      const leftCol = margin + 5
      const rightCol = margin + contentWidth / 2 + 5

      // Left column
      pdf.setFont("helvetica", "bold")
      pdf.text("Created:", leftCol, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(createdAt.toLocaleDateString(), leftCol + 25, yPosition)

      // Right column
      pdf.setFont("helvetica", "bold")
      pdf.text("Deadline:", rightCol, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(deadline.toLocaleDateString(), rightCol + 25, yPosition)
      yPosition += 6

      // Second row
      pdf.setFont("helvetica", "bold")
      pdf.text("Requested By:", leftCol, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(jobOrder.requestedBy || "N/A", leftCol + 35, yPosition)

      pdf.setFont("helvetica", "bold")
      pdf.text("Assigned To:", rightCol, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(jobOrder.assignTo || "Unassigned", rightCol + 30, yPosition)

      yPosition += 15

      // Site Information Section
      checkNewPage(50)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(30, 58, 138)
      pdf.text("SITE INFORMATION", margin, yPosition)
      yPosition += 2

      // Underline
      pdf.setLineWidth(2)
      pdf.setDrawColor(59, 130, 246)
      pdf.line(margin, yPosition, margin + 60, yPosition)
      yPosition += 10

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")

      // Site details in a structured layout
      const siteData = [
        { label: "Site Name:", value: jobOrder.siteName || "N/A" },
        { label: "Site Code:", value: jobOrder.siteCode || "N/A" },
        { label: "Location:", value: jobOrder.siteLocation || "N/A" },
        { label: "Site Type:", value: jobOrder.siteType || "N/A" },
        { label: "Site Size:", value: jobOrder.siteSize || "N/A" },
        { label: "Illumination:", value: jobOrder.siteIllumination || "N/A" },
      ]

      let currentY = yPosition
      siteData.forEach((item, index) => {
        const isLeftColumn = index % 2 === 0
        const xPos = isLeftColumn ? leftCol : rightCol

        if (isLeftColumn && index > 0) {
          currentY += 6
        }

        pdf.setFont("helvetica", "bold")
        pdf.text(item.label, xPos, currentY)
        pdf.setFont("helvetica", "normal")
        const labelWidth = item.label === "Illumination:" ? 30 : 25
        pdf.text(item.value, xPos + labelWidth, currentY)
      })

      yPosition = currentY + 10

      // Site Image if available
      if (jobOrder.siteImageUrl) {
        checkNewPage(60)
        pdf.setFontSize(12)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(30, 58, 138)
        pdf.text("SITE IMAGE", margin, yPosition)
        yPosition += 8

        try {
          const imageBase64 = await loadImageAsBase64(jobOrder.siteImageUrl)
          if (imageBase64) {
            const dimensions = await getImageDimensions(imageBase64)
            let { width, height } = dimensions
            const maxWidth = contentWidth * 0.6
            const maxHeight = 50

            // Calculate aspect ratio
            const aspectRatio = width / height
            if (width > height) {
              width = maxWidth
              height = width / aspectRatio
              if (height > maxHeight) {
                height = maxHeight
                width = height * aspectRatio
              }
            } else {
              height = maxHeight
              width = height * aspectRatio
              if (width > maxWidth) {
                width = maxWidth
                height = width / aspectRatio
              }
            }

            // Center the image
            const imageX = margin + (contentWidth - width) / 2
            pdf.addImage(imageBase64, "JPEG", imageX, yPosition, width, height)
            yPosition += height + 10
          }
        } catch (error) {
          console.error("Error adding site image:", error)
        }
      }

      // Contract Information Section
      checkNewPage(40)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(30, 58, 138)
      pdf.text("CONTRACT DETAILS", margin, yPosition)
      yPosition += 2

      pdf.setLineWidth(2)
      pdf.setDrawColor(59, 130, 246)
      pdf.line(margin, yPosition, margin + 60, yPosition)
      yPosition += 10

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)

      // Contract details
      const contractData = [
        { label: "Client Company:", value: jobOrder.clientCompany || "N/A" },
        { label: "Client Name:", value: jobOrder.clientName || "N/A" },
        { label: "Quotation #:", value: jobOrder.quotationNumber || "N/A" },
        { label: "Contract Duration:", value: jobOrder.contractDuration || "N/A" },
        {
          label: "Lease Rate/Month:",
          value: jobOrder.leaseRatePerMonth ? `PHP ${jobOrder.leaseRatePerMonth.toLocaleString()}` : "N/A",
        },
        {
          label: "Total Amount:",
          value: jobOrder.totalAmount ? `PHP ${jobOrder.totalAmount.toLocaleString()}` : "N/A",
        },
      ]

      currentY = yPosition
      contractData.forEach((item, index) => {
        const isLeftColumn = index % 2 === 0
        const xPos = isLeftColumn ? leftCol : rightCol

        if (isLeftColumn && index > 0) {
          currentY += 6
        }

        pdf.setFont("helvetica", "bold")
        pdf.text(item.label, xPos, currentY)
        pdf.setFont("helvetica", "normal")
        const labelWidth = item.label === "Contract Duration:" ? 40 : item.label === "Lease Rate/Month:" ? 40 : 35
        pdf.text(item.value, xPos + labelWidth, currentY)
      })

      yPosition = currentY + 15

      // Compliance Status Section
      checkNewPage(30)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(30, 58, 138)
      pdf.text("COMPLIANCE STATUS", margin, yPosition)
      yPosition += 2

      pdf.setLineWidth(2)
      pdf.setDrawColor(59, 130, 246)
      pdf.line(margin, yPosition, margin + 60, yPosition)
      yPosition += 10

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)

      // Compliance checkboxes
      const complianceItems = [
        { label: "PO/MO", status: jobOrder.poMo },
        { label: "Signed Quotation", status: jobOrder.signedQuotation },
        { label: "Project FA", status: jobOrder.projectFa },
      ]

      complianceItems.forEach((item, index) => {
        const xPos = leftCol + index * 60

        // Checkbox
        pdf.setLineWidth(0.5)
        pdf.setDrawColor(0, 0, 0)
        pdf.rect(xPos, yPosition - 2, 4, 4)

        if (item.status) {
          pdf.setFillColor(34, 197, 94) // Green
          pdf.rect(xPos + 0.5, yPosition - 1.5, 3, 3, "F")
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(8)
          pdf.text("✓", xPos + 1.2, yPosition + 0.5)
          pdf.setTextColor(0, 0, 0)
        }

        pdf.setFontSize(10)
        pdf.text(item.label, xPos + 8, yPosition + 1)
      })

      yPosition += 15

      // Remarks Section
      if (jobOrder.remarks) {
        checkNewPage(25)
        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(30, 58, 138)
        pdf.text("REMARKS", margin, yPosition)
        yPosition += 2

        pdf.setLineWidth(2)
        pdf.setDrawColor(59, 130, 246)
        pdf.line(margin, yPosition, margin + 30, yPosition)
        yPosition += 8

        pdf.setTextColor(0, 0, 0)
        pdf.setFontSize(10)
        pdf.setFont("helvetica", "normal")
        yPosition = addText(jobOrder.remarks, margin, yPosition, contentWidth)
        yPosition += 10
      }

      // Modern Footer
      const footerY = pageHeight - 25
      pdf.setFillColor(248, 250, 252)
      pdf.rect(0, footerY, pageWidth, 25, "F")

      pdf.setLineWidth(2)
      pdf.setDrawColor(59, 130, 246)
      pdf.line(0, footerY, pageWidth, footerY)

      pdf.setFontSize(8)
      pdf.setTextColor(107, 114, 128)
      pdf.text("Generated by OH Plus Platform", margin, footerY + 8)
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        margin,
        footerY + 15,
      )

      pdf.setFont("helvetica", "bold")
      pdf.text("LOGISTICS DEPARTMENT", pageWidth - margin - 50, footerY + 8)
      pdf.setFont("helvetica", "normal")
      pdf.text("Smart. Seamless. Scalable.", pageWidth - margin - 50, footerY + 15)

      // Save the PDF
      const fileName = `job-order-${jobOrder.joNumber}-${Date.now()}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsPrinting(false)
    }
  }

  const handlePrintJobOrder = () => {
    if (jobOrder) {
      generateJobOrderPDF(jobOrder)
    }
  }

  const getJoTypeColor = (joType: string) => {
    switch (joType?.toLowerCase()) {
      case "installation":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "repair":
        return "bg-red-100 text-red-800 border-red-200"
      case "dismantling":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-purple-100 text-purple-800 border-purple-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading Job Order details...</span>
        </div>
      </div>
    )
  }

  if (error || !jobOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Job Order Not Found</h2>
        <p className="text-gray-600 mb-4">{error || "The selected job order could not be loaded."}</p>
        <Button onClick={() => router.push("/logistics/job-orders")}>Back to Job Orders</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Job Order Details</h1>
        <Badge variant="secondary">
          <Package className="h-3 w-3 mr-1" />
          Logistics
        </Badge>
        <div className="ml-auto">
          <Button
            onClick={handlePrintJobOrder}
            disabled={isPrinting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Generating PDF..." : "Print Job Order"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
        {/* Left Column: Job Information */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Job Information</h2>
          <div className="space-y-3 text-gray-800">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <h3 className="text-blue-600 font-bold text-base">{jobOrder.joNumber}</h3>
                <Badge variant="outline" className={`${getStatusColor(jobOrder.status)} border font-medium`}>
                  {jobOrder.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Job Order ID: {jobOrder.id}</p>
            </div>

            <div className="space-y-0.5">
              <p className="text-sm">
                <span className="font-semibold">Site Name:</span> {jobOrder.siteName}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Site Location:</span> {jobOrder.siteLocation || "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-semibold">JO Type:</span>{" "}
                <Badge variant="outline" className={`${getJoTypeColor(jobOrder.joType)} border font-medium ml-1`}>
                  {jobOrder.joType}
                </Badge>
              </p>
            </div>

            {/* Site Preview */}
            <div className="space-y-1 mt-3">
              <p className="text-sm font-semibold">Site Preview:</p>
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-md">
                <Image
                  src={jobOrder.siteImageUrl || "/placeholder.svg?height=48&width=48"}
                  alt="Site preview"
                  width={48}
                  height={48}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{jobOrder.siteName}</p>
                  <p className="text-xs text-gray-600">{jobOrder.siteLocation || "Location not specified"}</p>
                  <p className="text-xs text-gray-500">{jobOrder.joType} Job</p>
                </div>
              </div>
            </div>

            {/* Job Description */}
            {jobOrder.jobDescription && (
              <div className="space-y-0.5 pt-4 border-t border-gray-200 mt-6">
                <p className="text-sm font-semibold">Job Description:</p>
                <p className="text-sm text-gray-700">{jobOrder.jobDescription}</p>
              </div>
            )}

            {/* Additional Message */}
            {jobOrder.message && (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Additional Message:</p>
                <p className="text-sm text-gray-700">{jobOrder.message}</p>
              </div>
            )}

            {/* Remarks */}
            {jobOrder.remarks && (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Remarks:</p>
                <p className="text-sm text-gray-700">{jobOrder.remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Job Order Details */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Job Order Details</h2>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Job Order Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-800">JO #</Label>
                <div className="p-2 bg-gray-100 rounded text-sm text-gray-600">{jobOrder.joNumber}</div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">Date Requested</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {jobOrder.dateRequested ? format(new Date(jobOrder.dateRequested), "PPP") : "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">JO Type</Label>
                <div className="p-2">
                  <Badge variant="outline" className={`${getJoTypeColor(jobOrder.joType)} border font-medium`}>
                    {jobOrder.joType}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">Deadline</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {jobOrder.deadline ? format(new Date(jobOrder.deadline), "PPP") : "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">Requested By</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  {jobOrder.requestedBy}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-800">Assigned To</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  {jobOrder.assignTo || "Unassigned"}
                </div>
              </div>

              {/* Attachments */}
              {jobOrder.attachments && jobOrder.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-800">Attachments</Label>
                  <div className="space-y-2">
                    {jobOrder.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {typeof attachment === "string" ? attachment : attachment.name || "Attachment"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button variant="outline" className="w-full bg-transparent text-gray-800 border-gray-300 hover:bg-gray-50">
              <Edit className="mr-2 h-4 w-4" />
              Edit Job Order
            </Button>
            <Button variant="outline" className="w-full bg-transparent text-gray-800 border-gray-300 hover:bg-gray-50">
              <UserCheck className="mr-2 h-4 w-4" />
              Assign Personnel
            </Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
