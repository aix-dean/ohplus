import jsPDF from "jspdf"
import type { Proposal } from "@/lib/types/proposal"
import type { JobOrder } from "@/lib/types/job-order"

// Helper function to load image and convert to base64
export async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PDF-Generator/1.0)",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => {
        console.error("FileReader error:", reader.error)
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Error loading image:", url, error)
    return null
  }
}

// Helper function to get image dimensions
export function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
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

// Helper function to generate QR code using online service
export async function generateQRCode(text: string): Promise<string> {
  try {
    // Using QR Server API for basic QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
    return qrUrl
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
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

async function logProposalPDFGenerated(proposalId: string, userId: string, userName: string): Promise<void> {
  // Placeholder for the actual logging implementation
  console.log(`PDF generated for proposal ${proposalId} by user ${userId} (${userName})`)
  return Promise.resolve()
}

// New helper function to calculate image dimensions for fitting
async function calculateImageFitDimensions(
  imageUrl: string,
  maxWidth: number,
  maxHeight: number,
): Promise<{ base64: string | null; width: number; height: number }> {
  const base64 = await loadImageAsBase64(imageUrl)
  if (!base64) return { base64: null, width: 0, height: 0 }

  const dimensions = await getImageDimensions(base64)
  let { width, height } = dimensions
  const aspectRatio = width / height

  // Scale to fit within max bounds
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return { base64, width, height }
}

// Helper function to format currency without +/- signs
function formatCurrency(amount: number | string): string {
  // Convert to number and ensure it's positive
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount.replace(/[^\d.-]/g, "")) : amount
  const cleanAmount = Math.abs(Number(numAmount) || 0)
  return `PHP${cleanAmount.toLocaleString()}`
}

// Helper function to resolve company logo based on user/company data
async function resolveCompanyLogo(userData?: any, projectData?: any): Promise<string> {
  // Priority order: project logo -> user company logo -> company name mapping -> default OH+ logo

  console.log("resolveCompanyLogo - userData:", userData)
  console.log("resolveCompanyLogo - projectData:", projectData)

  // Check if project has a custom logo URL (photo_url is commonly used)
  if (projectData?.photo_url && typeof projectData.photo_url === "string" && projectData.photo_url.trim() !== "") {
    try {
      const testResponse = await fetch(projectData.photo_url, { method: "HEAD" })
      if (testResponse.ok) {
        console.log("Using projectData.photo_url:", projectData.photo_url)
        return projectData.photo_url
      }
    } catch (error) {
      console.log("Project photo_url not accessible:", projectData.photo_url)
    }
  }

  // Check if user's company has a logo URL
  if (userData?.photo_url && typeof userData.photo_url === "string" && userData.photo_url.trim() !== "") {
    try {
      const testResponse = await fetch(userData.photo_url, { method: "HEAD" })
      if (testResponse.ok) {
        console.log("Using userData.photo_url:", userData.photo_url)
        return userData.photo_url
      }
    } catch (error) {
      console.log("User photo_url not accessible:", userData.photo_url)
    }
  }

  // Check alternative company logo fields
  if (
    userData?.company?.photo_url &&
    typeof userData.company.photo_url === "string" &&
    userData.company.photo_url.trim() !== ""
  ) {
    try {
      const testResponse = await fetch(userData.company.photo_url, { method: "HEAD" })
      if (testResponse.ok) {
        console.log("Using userData.company.photo_url:", userData.company.photo_url)
        return userData.company.photo_url
      }
    } catch (error) {
      console.log("User company photo_url not accessible:", userData.company.photo_url)
    }
  }

  // Check for company-specific logos based on company name
  const companyName = (
    projectData?.company_name ||
    projectData?.name ||
    userData?.company_name ||
    userData?.displayName ||
    userData?.display_name ||
    ""
  )
    .toLowerCase()
    .trim()

  if (companyName) {
    // Map company names to their logo files
    const companyLogos: Record<string, string> = {
      dedos: "/company-logos/dedos-logo.png",
      gts: "/company-logos/gts-logo.png",
      "global tronics": "/company-logos/gts-logo.png",
      globaltronics: "/globaltronics-logo.png",
      "summit media": "/summit-media-logo.png",
      "vistar media": "/vistar-media-logo.png",
      "moving walls": "/moving-walls-logo.png",
      "hdi admix": "/hdi-admix-logo.png",
      broadsign: "/broadsign-logo.png",
      dooh: "/dooh-logo.png",
      "ooh shop": "/ooh-shop-logo.png",
    }

    // Check for exact match first
    if (companyLogos[companyName]) {
      console.log("Using company name mapping:", companyName, "->", companyLogos[companyName])
      return companyLogos[companyName]
    }

    // Check for partial matches
    for (const [key, logoPath] of Object.entries(companyLogos)) {
      if (companyName.includes(key) || key.includes(companyName)) {
        console.log("Using partial company name mapping:", companyName, "contains", key, "->", logoPath)
        return logoPath
      }
    }
  }

  // Default fallback to OH+ logo
  console.log("Using default OH+ logo")
  return "/ohplus-new-logo.png"
}

// Service Assignment interface for PDF generation
interface ServiceAssignmentPDFData {
  saNumber: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  serviceDuration: string
  priority: string
  equipmentRequired: string
  materialSpecs: string
  crew: string
  illuminationNits: string
  gondola: string
  technology: string
  sales: string
  remarks: string
  requestedBy: {
    name: string
    department: string
  }
  startDate: Date | null
  endDate: Date | null
  alarmDate: Date | null
  alarmTime: string
  attachments: { name: string; type: string }[]
  serviceCost: {
    crewFee: string
    overtimeFee: string
    transpo: string
    tollFee: string
    mealAllowance: string
    otherFees: { name: string; amount: string }[]
    total: number
  }
  status: string
  created: Date
}

export async function generateServiceAssignmentPDF(
  serviceAssignment: ServiceAssignmentPDFData,
  returnBase64 = false,
): Promise<string | void> {
  try {
    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

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

    // Header with company branding
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.rect(0, 0, pageWidth, 25, "F")

    // Add white text for header
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    pdf.text("SERVICE ASSIGNMENT", margin, 15)

    // Add logistics badge
    pdf.setFontSize(10)
    pdf.text("LOGISTICS DEPARTMENT", pageWidth - margin - 50, 15)

    yPosition = 35
    pdf.setTextColor(0, 0, 0)

    // Service Assignment Title and Number
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text(`SA# ${serviceAssignment.saNumber}`, margin, yPosition)
    yPosition += 10

    // Status badge
    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case "completed":
          return [34, 197, 94] // green
        case "pending":
          return [234, 179, 8] // yellow
        case "approved":
          return [59, 130, 246] // blue
        case "draft":
          return [107, 114, 128] // gray
        default:
          return [107, 114, 128] // gray
      }
    }

    const statusColor = getStatusColor(serviceAssignment.status)
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2])
    pdf.rect(margin, yPosition, 25, 8, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    pdf.text(serviceAssignment.status.toUpperCase(), margin + 2, yPosition + 5)
    pdf.setTextColor(0, 0, 0)

    yPosition += 20

    // Service Assignment Information Section
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("SERVICE ASSIGNMENT INFORMATION", margin, yPosition)
    yPosition += 8

    // Draw section separator
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Two column layout for service information
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // Left column
    let leftY = yPosition
    const leftColumnData = [
      { label: "SA Number:", value: serviceAssignment.saNumber },
      { label: "Project Site:", value: serviceAssignment.projectSiteName },
      { label: "Location:", value: serviceAssignment.projectSiteLocation || "N/A" },
      { label: "Service Type:", value: serviceAssignment.serviceType },
      { label: "Assigned To:", value: serviceAssignment.assignedTo },
      {
        label: "Duration:",
        value: serviceAssignment.serviceDuration ? `${serviceAssignment.serviceDuration} hours` : "N/A",
      },
      { label: "Priority:", value: serviceAssignment.priority },
      { label: "Crew:", value: serviceAssignment.crew || "N/A" },
    ]

    leftColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, leftColumn, leftY)
      pdf.setFont("helvetica", "normal")
      pdf.text(item.value, leftColumn + 35, leftY)
      leftY += 6
    })

    // Right column
    let rightY = yPosition
    const rightColumnData = [
      { label: "Created:", value: serviceAssignment.created.toLocaleDateString() },
      {
        label: "Start Date:",
        value: serviceAssignment.startDate ? serviceAssignment.startDate.toLocaleDateString() : "N/A",
      },
      { label: "End Date:", value: serviceAssignment.endDate ? serviceAssignment.endDate.toLocaleDateString() : "N/A" },
      {
        label: "Alarm Date:",
        value: serviceAssignment.alarmDate ? serviceAssignment.alarmDate.toLocaleDateString() : "N/A",
      },
      { label: "Alarm Time:", value: serviceAssignment.alarmTime || "N/A" },
      {
        label: "Illumination:",
        value: serviceAssignment.illuminationNits ? `${serviceAssignment.illuminationNits} nits` : "N/A",
      },
      { label: "Gondola:", value: serviceAssignment.gondola || "N/A" },
      { label: "Technology:", value: serviceAssignment.technology || "N/A" },
    ]

    rightColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, rightColumn, rightY)
      pdf.setFont("helvetica", "normal")
      pdf.text(item.value, rightColumn + 35, rightY)
      rightY += 6
    })

    yPosition = Math.max(leftY, rightY) + 10

    // Equipment and Materials Section
    if (serviceAssignment.equipmentRequired || serviceAssignment.materialSpecs) {
      checkNewPage(30)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("EQUIPMENT & MATERIALS", margin, yPosition)
      yPosition += 8

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")

      if (serviceAssignment.equipmentRequired) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Equipment Required:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 5
        yPosition = addText(serviceAssignment.equipmentRequired, margin, yPosition, contentWidth)
        yPosition += 5
      }

      if (serviceAssignment.materialSpecs) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Material Specifications:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 5
        yPosition = addText(serviceAssignment.materialSpecs, margin, yPosition, contentWidth)
      }

      yPosition += 10
    }

    // Service Cost Section
    if (serviceAssignment.serviceCost.total > 0) {
      checkNewPage(40)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("SERVICE COST BREAKDOWN", margin, yPosition)
      yPosition += 8

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")

      const costItems = [
        { label: "Crew Fee:", value: serviceAssignment.serviceCost.crewFee },
        { label: "Overtime Fee:", value: serviceAssignment.serviceCost.overtimeFee },
        { label: "Transportation:", value: serviceAssignment.serviceCost.transpo },
        { label: "Toll Fee:", value: serviceAssignment.serviceCost.tollFee },
        { label: "Meal Allowance:", value: serviceAssignment.serviceCost.mealAllowance },
      ]

      costItems.forEach((item) => {
        if (item.value && Number.parseFloat(item.value) > 0) {
          pdf.setFont("helvetica", "bold")
          pdf.text(item.label, margin, yPosition)
          pdf.setFont("helvetica", "normal")
          pdf.text(formatCurrency(Number.parseFloat(item.value)), rightColumn, yPosition)
          yPosition += 6
        }
      })

      // Other fees
      serviceAssignment.serviceCost.otherFees.forEach((fee) => {
        if (fee.name && fee.amount && Number.parseFloat(fee.amount) > 0) {
          pdf.setFont("helvetica", "bold")
          pdf.text(`${fee.name}:`, margin, yPosition)
          pdf.setFont("helvetica", "normal")
          pdf.text(formatCurrency(Number.parseFloat(fee.amount)), rightColumn, yPosition)
          yPosition += 6
        }
      })

      // Total
      yPosition += 5
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("TOTAL COST:", margin, yPosition)
      pdf.text(formatCurrency(serviceAssignment.serviceCost.total), rightColumn, yPosition)
      yPosition += 15
    }

    // Remarks Section
    if (serviceAssignment.remarks) {
      checkNewPage(30)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("REMARKS", margin, yPosition)
      yPosition += 8

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(serviceAssignment.remarks, margin, yPosition, contentWidth)
      yPosition += 10
    }

    // Requested By Section
    checkNewPage(20)
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("REQUESTED BY", margin, yPosition)
    yPosition += 8

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${serviceAssignment.requestedBy.department} - ${serviceAssignment.requestedBy.name}`, margin, yPosition)
    yPosition += 15

    // Footer
    checkNewPage(30)
    yPosition = pageHeight - 40

    // Footer separator
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Footer content
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(100, 100, 100)

    pdf.text("Generated by OH Plus Platform - Logistics Department", margin, yPosition)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPosition + 5)

    // Company info on the right
    pdf.text("Smart. Seamless. Scalable.", pageWidth - margin - 50, yPosition)
    pdf.setFont("helvetica", "bold")
    pdf.text("OH+", pageWidth - margin - 15, yPosition + 5)

    if (returnBase64) {
      // Return base64 string for email attachment
      return pdf.output("datauristring").split(",")[1]
    } else {
      // Save the PDF for download
      const fileName = `service-assignment-${serviceAssignment.saNumber.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Service Assignment PDF:", error)
    throw new Error("Failed to generate Service Assignment PDF")
  }
}

export async function generateJobOrderPDF(jobOrder: JobOrder, returnBase64 = false): Promise<string | void> {
  try {
    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    // Safely convert dates
    const dateRequested = safeToDate(jobOrder.dateRequested)
    const deadline = safeToDate(jobOrder.deadline)
    const contractStart = jobOrder.contractPeriodStart ? safeToDate(jobOrder.contractPeriodStart) : null
    const contractEnd = jobOrder.contractPeriodEnd ? safeToDate(jobOrder.contractPeriodEnd) : null

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

    // Header with company branding
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.rect(0, 0, pageWidth, 25, "F")

    // Add white text for header
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    pdf.text("JOB ORDER", margin, 15)

    // Add logistics badge
    pdf.setFontSize(10)
    pdf.text("LOGISTICS DEPARTMENT", pageWidth - margin - 50, 15)

    yPosition = 35
    pdf.setTextColor(0, 0, 0)

    // Job Order Title and Number
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text(jobOrder.joNumber, margin, yPosition)
    yPosition += 10

    // Status badge
    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case "completed":
          return [34, 197, 94] // green
        case "pending":
          return [234, 179, 8] // yellow
        case "approved":
          return [59, 130, 246] // blue
        case "rejected":
          return [239, 68, 68] // red
        default:
          return [107, 114, 128] // gray
      }
    }

    const statusColor = getStatusColor(jobOrder.status)
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2])
    pdf.rect(margin, yPosition, 25, 8, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    pdf.text(jobOrder.status.toUpperCase(), margin + 2, yPosition + 5)
    pdf.setTextColor(0, 0, 0)

    // Type badge
    const getTypeColor = (type: string) => {
      switch (type?.toLowerCase()) {
        case "installation":
          return [59, 130, 246] // blue
        case "maintenance":
          return [234, 179, 8] // yellow
        case "repair":
          return [239, 68, 68] // red
        case "dismantling":
          return [107, 114, 128] // gray
        default:
          return [147, 51, 234] // purple
      }
    }

    const typeColor = getTypeColor(jobOrder.joType)
    pdf.setFillColor(typeColor[0], typeColor[1], typeColor[2])
    pdf.rect(margin + 30, yPosition, 30, 8, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.text(jobOrder.joType.toUpperCase(), margin + 32, yPosition + 5)
    pdf.setTextColor(0, 0, 0)

    yPosition += 20

    // Job Order Information Section
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("JOB ORDER INFORMATION", margin, yPosition)
    yPosition += 8

    // Draw section separator
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Two column layout for job information
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // Left column
    let leftY = yPosition
    const leftColumnData = [
      { label: "JO Number:", value: jobOrder.joNumber },
      { label: "Site Name:", value: jobOrder.siteName },
      { label: "Site Code:", value: jobOrder.siteCode || "N/A" },
      { label: "Site Location:", value: jobOrder.siteLocation || "N/A" },
      { label: "Site Type:", value: jobOrder.siteType || "N/A" },
      { label: "Site Size:", value: jobOrder.siteSize || "N/A" },
      { label: "Requested By:", value: jobOrder.requestedBy },
      { label: "Assigned To:", value: jobOrder.assignTo },
    ]

    leftColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, leftColumn, leftY)
      pdf.setFont("helvetica", "normal")
      pdf.text(item.value, leftColumn + 35, leftY)
      leftY += 6
    })

    // Right column
    let rightY = yPosition
    const rightColumnData = [
      { label: "Date Requested:", value: dateRequested.toLocaleDateString() },
      { label: "Deadline:", value: deadline.toLocaleDateString() },
      { label: "Client Company:", value: jobOrder.clientCompany || "N/A" },
      { label: "Client Name:", value: jobOrder.clientName || "N/A" },
      { label: "Quotation No.:", value: jobOrder.quotationNumber || "N/A" },
      { label: "Total Amount:", value: jobOrder.totalAmount ? formatCurrency(jobOrder.totalAmount) : "N/A" },
      { label: "VAT Amount:", value: jobOrder.vatAmount ? formatCurrency(jobOrder.vatAmount) : "N/A" },
      { label: "Contract Duration:", value: jobOrder.contractDuration || "N/A" },
    ]

    rightColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, rightColumn, rightY)
      pdf.setFont("helvetica", "normal")
      pdf.text(item.value, rightColumn + 40, rightY)
      rightY += 6
    })

    yPosition = Math.max(leftY, rightY) + 10

    // Contract Period Section (if available)
    if (contractStart && contractEnd) {
      checkNewPage(30)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("CONTRACT PERIOD", margin, yPosition)
      yPosition += 8

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Start Date: ${contractStart.toLocaleDateString()}`, margin, yPosition)
      pdf.text(`End Date: ${contractEnd.toLocaleDateString()}`, rightColumn, yPosition)
      yPosition += 15
    }

    // Job Description Section
    if (jobOrder.jobDescription || jobOrder.remarks) {
      checkNewPage(40)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("JOB DESCRIPTION", margin, yPosition)
      yPosition += 8

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")

      if (jobOrder.jobDescription) {
        yPosition = addText(jobOrder.jobDescription, margin, yPosition, contentWidth)
        yPosition += 5
      }

      if (jobOrder.remarks) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Remarks:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 5
        yPosition = addText(jobOrder.remarks, margin, yPosition, contentWidth)
      }

      yPosition += 10
    }

    // Site Image Section (if available)
    if (jobOrder.siteImageUrl) {
      checkNewPage(80)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("SITE IMAGE", margin, yPosition)
      yPosition += 8

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      try {
        const { base64, width, height } = await calculateImageFitDimensions(
          jobOrder.siteImageUrl,
          contentWidth * 0.8,
          60,
        )

        if (base64) {
          const imageX = margin + (contentWidth - width) / 2
          pdf.addImage(base64, "JPEG", imageX, yPosition, width, height)
          yPosition += height + 10
        }
      } catch (error) {
        console.error("Error adding site image:", error)
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        pdf.text("Site image could not be loaded", margin, yPosition)
        pdf.setTextColor(0, 0, 0)
        yPosition += 15
      }
    }

    // Compliance Status Section
    if (jobOrder.poMo !== undefined || jobOrder.projectFa !== undefined || jobOrder.signedQuotation !== undefined) {
      checkNewPage(40)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("COMPLIANCE STATUS", margin, yPosition)
      yPosition += 8

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")

      const complianceItems = [
        { label: "Purchase Order/MO:", status: jobOrder.poMo },
        { label: "Project FA:", status: jobOrder.projectFa },
        { label: "Signed Quotation:", status: jobOrder.signedQuotation },
      ]

      complianceItems.forEach((item, index) => {
        if (item.status !== undefined) {
          pdf.setFont("helvetica", "bold")
          pdf.text(item.label, margin, yPosition)

          // Status indicator
          const statusColor = item.status ? [34, 197, 94] : [239, 68, 68] // green or red
          pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2])
          pdf.rect(margin + 50, yPosition - 3, 20, 6, "F")
          pdf.setTextColor(255, 255, 255)
          pdf.setFont("helvetica", "bold")
          pdf.text(item.status ? "YES" : "NO", margin + 55, yPosition)
          pdf.setTextColor(0, 0, 0)

          yPosition += 8
        }
      })

      yPosition += 5
    }

    // Footer
    checkNewPage(30)
    yPosition = pageHeight - 40

    // Footer separator
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Footer content
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(100, 100, 100)

    pdf.text("Generated by OH Plus Platform - Logistics Department", margin, yPosition)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPosition + 5)

    // Company info on the right
    pdf.text("Smart. Seamless. Scalable.", pageWidth - margin - 50, yPosition)
    pdf.setFont("helvetica", "bold")
    pdf.text("OH+", pageWidth - margin - 15, yPosition + 5)

    if (returnBase64) {
      // Return base64 string for email attachment
      return pdf.output("datauristring").split(",")[1]
    } else {
      // Save the PDF for download
      const fileName = `job-order-${jobOrder.joNumber.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Job Order PDF:", error)
    throw new Error("Failed to generate Job Order PDF")
  }
}

export async function generateProposalPDF(proposal: Proposal, returnBase64 = false): Promise<string | void> {
  try {
    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin
    let isFirstPage = true // Track if we're on the first page

    // Safely convert dates
    const createdAt = safeToDate(proposal.createdAt)
    const validUntil = safeToDate(proposal.validUntil)

    // Generate QR Code for proposal view URL
    const proposalViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.id}`
    const qrCodeUrl = await generateQRCode(proposalViewUrl)

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
        isFirstPage = false // Mark that we're no longer on the first page
        // DO NOT add QR code to subsequent pages
      }
    }

    // Helper function to add QR code ONLY to the first page
    const addQRCodeToFirstPage = async () => {
      if (!isFirstPage) return // Only add QR code to first page

      try {
        const qrSize = 18
        const qrX = pageWidth - margin - qrSize
        const qrY = margin

        // Ensure QR code stays within margins
        if (qrX < margin) {
          return // Skip QR code if it doesn't fit
        }

        // Load QR code image and add to PDF
        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)

          // Add small text below QR code
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          const textWidth = pdf.getTextWidth("Scan to view online")
          const textX = qrX + (qrSize - textWidth) / 2

          // Ensure text stays within margins
          if (textX >= margin && textX + textWidth <= pageWidth - margin) {
            pdf.text("Scan to view online", textX, qrY + qrSize + 3)
          }
          pdf.setTextColor(0, 0, 0)
        }
      } catch (error) {
        console.error("Error adding QR code to PDF:", error)
        // Continue without QR code if it fails
      }
    }

    // Add QR code to first page only
    await addQRCodeToFirstPage()

    // Header with better spacing from QR code
    const headerContentWidth = contentWidth - 22
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text("PROPOSAL", margin, yPosition)
    yPosition += 12

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "normal")
    const titleLines = pdf.splitTextToSize(proposal.title || "Untitled Proposal", headerContentWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 6 + 3

    // Date and validity with better formatting
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Created: ${createdAt.toLocaleDateString()}`, margin, yPosition)
    pdf.text(`Valid Until: ${validUntil.toLocaleDateString()}`, margin, yPosition + 5)
    yPosition += 15

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    // Client Information Section
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("CLIENT INFORMATION", margin, yPosition)
    yPosition += 6

    // Draw line under section header
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Client details in two columns with better spacing
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    // Left column
    pdf.setFont("helvetica", "bold")
    pdf.text("Company:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.company || "N/A", leftColumn + 25, yPosition)

    // Right column
    pdf.setFont("helvetica", "bold")
    pdf.text("Contact Person:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.contactPerson || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Second row
    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.email || "N/A", leftColumn + 25, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.phone || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Third row - Industry and Designation
    pdf.setFont("helvetica", "bold")
    pdf.text("Industry:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.industry || "N/A", leftColumn + 25, yPosition)

    // Add designation field
    if (proposal.client?.designation) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Designation:", rightColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(proposal.client.designation, rightColumn + 35, yPosition)
    }
    yPosition += 6

    // Address (full width if present)
    if (proposal.client?.address) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Address:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(proposal.client.address, leftColumn + 25, yPosition, contentWidth - 25)
      yPosition += 3
    }

    yPosition += 8

    // Products Section
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("PRODUCTS & SERVICES", margin, yPosition)
    yPosition += 6

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Products with better formatting
    if (proposal.products && proposal.products.length > 0) {
      for (let index = 0; index < proposal.products.length; index++) {
        const product = proposal.products[index]

        // Calculate required space more accurately
        let requiredHeight = 25

        // Add height for images if they exist
        if (product.media && product.media.length > 0) {
          requiredHeight += 80
        }

        checkNewPage(requiredHeight)

        // Product header with better formatting
        pdf.setFontSize(12)
        pdf.setFont("helvetica", "bold")
        pdf.text(`${index + 1}. ${product.name || "Unnamed Product"}`, margin, yPosition)
        yPosition += 5
        // Price on the right without +/- signs
        const price =
          typeof product.price === "string"
            ? Number.parseFloat(product.price.replace(/[^\d.-]/g, ""))
            : product.price || 0
        const priceText = formatCurrency(price)
        const priceWidth = pdf.getTextWidth(priceText)
        const width = pageWidth - (margin - priceWidth)
        pdf.text(priceText, pageWidth - margin - priceWidth, yPosition)
        yPosition += 5

        pdf.setFontSize(9)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(100, 100, 100)
        pdf.text(product.type || "N/A", margin + 5, yPosition)
        yPosition += 4

        pdf.setTextColor(0, 0, 0)

        // Product details with better spacing
        pdf.text(`Location: ${product.location || "N/A"}`, margin + 5, yPosition)
        yPosition += 4

        if (product.site_code) {
          pdf.text(`Site Code: ${product.site_code}`, margin + 5, yPosition)
          yPosition += 4
        }

        if (product.specs_rental) {
          if (product.specs_rental.traffic_count) {
            pdf.text(`Traffic Count: ${product.specs_rental.traffic_count.toLocaleString()}/day`, margin + 5, yPosition)
            yPosition += 4
          }
          if (product.specs_rental.height && product.specs_rental.width) {
            pdf.text(
              `Dimensions: ${product.specs_rental.height}m × ${product.specs_rental.width}m`,
              margin + 5,
              yPosition,
            )
            yPosition += 4
          }
          if (product.specs_rental.audience_type) {
            pdf.text(`Audience: ${product.specs_rental.audience_type}`, margin + 5, yPosition)
            yPosition += 4
          }
        }

        if (product.description) {
          pdf.setFont("helvetica", "italic")
          yPosition = addText(product.description, margin + 5, yPosition, contentWidth - 10, 9)
          pdf.setFont("helvetica", "normal")
          yPosition += 3
        }

        // Add product images with UNIFORM sizing and proper margin handling
        if (product.media && product.media.length > 0) {
          yPosition += 5
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(10)
          pdf.text("Product Images:", margin + 5, yPosition)
          yPosition += 8

          // Filter out video files
          const imagesToShow = product.media.filter((media) => !media.isVideo)

          if (imagesToShow.length > 0) {
            // FIXED UNIFORM IMAGE DIMENSIONS
            const uniformImageWidth = 55 // Fixed width for ALL images
            const uniformImageHeight = 40 // Fixed height for ALL images
            const imageSpacing = 8
            const imagesPerRow = 3 // Maximum 3 images per row
            const totalRowWidth = uniformImageWidth * imagesPerRow + imageSpacing * (imagesPerRow - 1)

            // Ensure images fit within content width
            let finalImageWidth = uniformImageWidth
            let finalImageHeight = uniformImageHeight

            if (totalRowWidth > contentWidth) {
              // Adjust for smaller images if needed but keep them uniform
              const adjustedImageWidth = (contentWidth - imageSpacing * (imagesPerRow - 1)) / imagesPerRow
              finalImageWidth = Math.min(adjustedImageWidth, uniformImageWidth)
              // Maintain aspect ratio
              finalImageHeight = (finalImageWidth / uniformImageWidth) * uniformImageHeight
            }

            const currentRow = 0
            let currentCol = 0
            let rowStartY = yPosition

            for (let imgIndex = 0; imgIndex < imagesToShow.length; imgIndex++) {
              const media = imagesToShow[imgIndex]

              // Check if we need a new page for this row
              if (currentCol === 0) {
                checkNewPage(finalImageHeight + 15)
                rowStartY = yPosition
              }

              // Calculate position for current image
              const imageX = margin + currentCol * (finalImageWidth + imageSpacing)
              const imageY = rowStartY
              if (media.url) {
                try {
                  const base64 = await loadImageAsBase64(media.url)
                  if (base64) {
                    pdf.addImage(base64, "JPEG", imageX, imageY, finalImageWidth, finalImageHeight)
                  }
                } catch (error) {
                  console.error("Error adding product image:", error)
                }
              }

              // Move to next column
              currentCol++

              // Check if we need to start a new row
              if (currentCol >= imagesPerRow) {
                currentCol = 0
                yPosition = rowStartY + finalImageHeight + imageSpacing
              }
            }

            // Add final spacing after all images
            if (currentCol > 0) {
              yPosition = rowStartY + finalImageHeight + imageSpacing
            }
          }
        }

        yPosition += 12
      }
    }

    // Summary Section with better formatting
    checkNewPage(30)
    yPosition += 5
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("PROPOSAL SUMMARY", margin, yPosition)
    yPosition += 6

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Total Products: ${proposal.products?.length || 0}`, margin, yPosition)
    yPosition += 6

    // Total amount without +/- signs and better formatting
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    const totalAmount = proposal.totalAmount || 0
    const totalText = `TOTAL AMOUNT: ${formatCurrency(totalAmount)}`
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition - 4, contentWidth, 12, "F")
    pdf.text(totalText, margin + 5, yPosition + 3)
    yPosition += 15

    // Notes and Custom Message
    if (proposal.notes || proposal.customMessage) {
      checkNewPage(25)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("ADDITIONAL INFORMATION", margin, yPosition)
      yPosition += 6

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")

      if (proposal.notes) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Notes:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(proposal.notes, margin, yPosition, contentWidth)
        yPosition += 5
      }

      if (proposal.customMessage) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Custom Message:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(proposal.customMessage, margin, yPosition, contentWidth)
      }
    }

    // Footer
    const footerY = pageHeight - 15
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text("Generated by OH Plus Platform", margin, footerY)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, footerY)

    if (returnBase64) {
      // Return base64 string for email attachment
      return pdf.output("datauristring").split(",")[1]
    } else {
      // Save the PDF for download
      const fileName = `proposal-${(proposal.title || "proposal").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

// Function to generate the PDF in memory
async function generateProposalPDFInMemory(proposal: Proposal): Promise<jsPDF> {
  try {
    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin
    let isFirstPage = true // Track if we're on the first page

    // Safely convert dates
    const createdAt = safeToDate(proposal.createdAt)
    const validUntil = safeToDate(proposal.validUntil)

    // Generate QR Code for proposal view URL
    const proposalViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.id}`
    const qrCodeUrl = await generateQRCode(proposalViewUrl)

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
        isFirstPage = false // Mark that we're no longer on the first page
        // DO NOT add QR code to subsequent pages
      }
    }

    // Helper function to add QR code ONLY to the first page
    const addQRCodeToFirstPage = async () => {
      if (!isFirstPage) return // Only add QR code to first page

      try {
        const qrSize = 18
        const qrX = pageWidth - margin - qrSize
        const qrY = margin

        // Ensure QR code stays within margins
        if (qrX < margin) {
          return // Skip QR code if it doesn't fit
        }

        // Load QR code image and add to PDF
        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)

          // Add small text below QR code
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          const textWidth = pdf.getTextWidth("Scan to view online")
          const textX = qrX + (qrSize - textWidth) / 2

          // Ensure text stays within margins
          if (textX >= margin && textX + textWidth <= pageWidth - margin) {
            pdf.text("Scan to view online", textX, qrY + qrSize + 3)
          }
          pdf.setTextColor(0, 0, 0)
        }
      } catch (error) {
        console.error("Error adding QR code to PDF:", error)
        // Continue without QR code if it fails
      }
    }

    // Add QR code to first page only
    await addQRCodeToFirstPage()

    // Header with better spacing from QR code
    const headerContentWidth = contentWidth - 22
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text("PROPOSAL", margin, yPosition)
    yPosition += 12

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "normal")
    const titleLines = pdf.splitTextToSize(proposal.title || "Untitled Proposal", headerContentWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 6 + 3

    // Date and validity with better formatting
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Created: ${createdAt.toLocaleDateString()}`, margin, yPosition)
    pdf.text(`Valid Until: ${validUntil.toLocaleDateString()}`, margin, yPosition + 5)
    yPosition += 15

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    // Client Information Section
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("CLIENT INFORMATION", margin, yPosition)
    yPosition += 6

    // Draw line under section header
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Client details in two columns with better spacing
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    // Left column
    pdf.setFont("helvetica", "bold")
    pdf.text("Company:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.company || "N/A", leftColumn + 25, yPosition)

    // Right column
    pdf.setFont("helvetica", "bold")
    pdf.text("Contact Person:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.contactPerson || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Second row
    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.email || "N/A", leftColumn + 25, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.phone || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Third row - Industry and Designation
    pdf.setFont("helvetica", "bold")
    pdf.text("Industry:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(proposal.client?.industry || "N/A", leftColumn + 25, yPosition)

    // Add designation field
    if (proposal.client?.designation) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Designation:", rightColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(proposal.client.designation, rightColumn + 35, yPosition)
    }
    yPosition += 6

    // Address (full width if present)
    if (proposal.client?.address) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Address:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(proposal.client.address, leftColumn + 25, yPosition, contentWidth - 25)
      yPosition += 3
    }

    yPosition += 8

    // Products Section
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("PRODUCTS & SERVICES", margin, yPosition)
    yPosition += 6

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Products with better formatting
    if (proposal.products && proposal.products.length > 0) {
      for (let index = 0; index < proposal.products.length; index++) {
        const product = proposal.products[index]

        // Calculate required space more accurately
        let requiredHeight = 25

        // Add height for images if they exist
        if (product.media && product.media.length > 0) {
          requiredHeight += 80
        }

        checkNewPage(requiredHeight)

        // Product header with better formatting
        pdf.setFontSize(12)
        pdf.setFont("helvetica", "bold")
        pdf.text(`${index + 1}. ${product.name || "Unnamed Product"}`, margin, yPosition)
        yPosition += 5
        // Price on the right without +/- signs
        const price =
          typeof product.price === "string"
            ? Number.parseFloat(product.price.replace(/[^\d.-]/g, ""))
            : product.price || 0
        const priceText = formatCurrency(price)
        const priceWidth = pdf.getTextWidth(priceText)
        const width = pageWidth - (margin - priceWidth)
        pdf.text(priceText, pageWidth - margin - priceWidth, yPosition)
        yPosition += 5

        pdf.setFontSize(9)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(100, 100, 100)
        pdf.text(product.type || "N/A", margin + 5, yPosition)
        yPosition += 4

        pdf.setTextColor(0, 0, 0)

        // Product details with better spacing
        pdf.text(`Location: ${product.location || "N/A"}`, margin + 5, yPosition)
        yPosition += 4

        if (product.site_code) {
          pdf.text(`Site Code: ${product.site_code}`, margin + 5, yPosition)
          yPosition += 4
        }

        if (product.specs_rental) {
          if (product.specs_rental.traffic_count) {
            pdf.text(`Traffic Count: ${product.specs_rental.traffic_count.toLocaleString()}/day`, margin + 5, yPosition)
            yPosition += 4
          }
          if (product.specs_rental.height && product.specs_rental.width) {
            pdf.text(
              `Dimensions: ${product.specs_rental.height}m × ${product.specs_rental.width}m`,
              margin + 5,
              yPosition,
            )
            yPosition += 4
          }
          if (product.specs_rental.audience_type) {
            pdf.text(`Audience: ${product.specs_rental.audience_type}`, margin + 5, yPosition)
            yPosition += 4
          }
        }

        if (product.description) {
          pdf.setFont("helvetica", "italic")
          yPosition = addText(product.description, margin + 5, yPosition, contentWidth - 10, 9)
          pdf.setFont("helvetica", "normal")
          yPosition += 3
        }

        // Add product images with UNIFORM sizing and proper margin handling
        if (product.media && product.media.length > 0) {
          yPosition += 5
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(10)
          pdf.text("Product Images:", margin + 5, yPosition)
          yPosition += 8

          // Filter out video files
          const imagesToShow = product.media.filter((media) => !media.isVideo)

          if (imagesToShow.length > 0) {
            // FIXED UNIFORM IMAGE DIMENSIONS
            const uniformImageWidth = 55 // Fixed width for ALL images
            const uniformImageHeight = 40 // Fixed height for ALL images
            const imageSpacing = 8
            const imagesPerRow = 3 // Maximum 3 images per row
            const totalRowWidth = uniformImageWidth * imagesPerRow + imageSpacing * (imagesPerRow - 1)

            // Ensure images fit within content width
            let finalImageWidth = uniformImageWidth
            let finalImageHeight = uniformImageHeight

            if (totalRowWidth > contentWidth) {
              // Adjust for smaller images if needed but keep them uniform
              const adjustedImageWidth = (contentWidth - imageSpacing * (imagesPerRow - 1)) / imagesPerRow
              finalImageWidth = Math.min(adjustedImageWidth, uniformImageWidth)
              // Maintain aspect ratio
              finalImageHeight = (finalImageWidth / uniformImageWidth) * uniformImageHeight
            }

            const currentRow = 0
            let currentCol = 0
            let rowStartY = yPosition

            for (let imgIndex = 0; imgIndex < imagesToShow.length; imgIndex++) {
              const media = imagesToShow[imgIndex]

              // Check if we need a new page for this row
              if (currentCol === 0) {
                checkNewPage(finalImageHeight + 15)
                rowStartY = yPosition
              }

              // Calculate position for current image
              const imageX = margin + currentCol * (finalImageWidth + imageSpacing)
              const imageY = rowStartY
              if (media.url) {
                try {
                  const base64 = await loadImageAsBase64(media.url)
                  if (base64) {
                    pdf.addImage(base64, "JPEG", imageX, imageY, finalImageWidth, finalImageHeight)
                  }
                } catch (error) {
                  console.error("Error adding product image:", error)
                }
              }

              // Move to next column
              currentCol++

              // Check if we need to start a new row
              if (currentCol >= imagesPerRow) {
                currentCol = 0
                yPosition = rowStartY + finalImageHeight + imageSpacing
              }
            }

            // Add final spacing after all images
            if (currentCol > 0) {
              yPosition = rowStartY + finalImageHeight + imageSpacing
            }
          }
        }

        yPosition += 12
      }
    }

    // Summary Section with better formatting
    checkNewPage(30)
    yPosition += 5
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("PROPOSAL SUMMARY", margin, yPosition)
    yPosition += 6

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Total Products: ${proposal.products?.length || 0}`, margin, yPosition)
    yPosition += 6

    // Total amount without +/- signs and better formatting
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    const totalAmount = proposal.totalAmount || 0
    const totalText = `TOTAL AMOUNT: ${formatCurrency(totalAmount)}`
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition - 4, contentWidth, 12, "F")
    pdf.text(totalText, margin + 5, yPosition + 3)
    yPosition += 15

    // Notes and Custom Message
    if (proposal.notes || proposal.customMessage) {
      checkNewPage(25)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("ADDITIONAL INFORMATION", margin, yPosition)
      yPosition += 6

      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")

      if (proposal.notes) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Notes:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(proposal.notes, margin, yPosition, contentWidth)
        yPosition += 5
      }

      if (proposal.customMessage) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Custom Message:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(proposal.customMessage, margin, yPosition, contentWidth)
      }
    }

    // Footer
    const footerY = pageHeight - 15
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text("Generated by OH Plus Platform", margin, footerY)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, footerY)

    return pdf
  } catch (error) {
    console.error("Error generating PDF in memory:", error)
    throw new Error("Failed to generate PDF")
  }
}

export async function generatePublicProposalPDFWithSaveDialog(proposal: Proposal): Promise<void> {
  try {
    // Generate the PDF in memory first
    const pdf = await generateProposalPDFInMemory(proposal)

    // Check if File System Access API is supported
    if ("showSaveFilePicker" in window) {
      try {
        // Use File System Access API for modern browsers
        const suggestedName = `proposal-${proposal.id.slice(0, 8)}-${Date.now()}.pdf`

        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [
            {
              description: "PDF files",
              accept: {
                "application/pdf": [".pdf"],
              },
            },
          ],
        })

        const writable = await fileHandle.createWritable()
        const pdfBlob = pdf.output("blob")
        await writable.write(pdfBlob)
        await writable.close()

        return
      } catch (error) {
        // User cancelled the save dialog or other error
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Save operation was aborted by user")
        }
        throw error
      }
    } else {
      // Fallback for browsers that don't support File System Access API
      const fileName = `proposal-${proposal.id.slice(0, 8)}-${Date.now()}.pdf`
      pdf.save(fileName)
      return
    }
  } catch (error) {
    console.error("Error in generatePublicProposalPDFWithSaveDialog:", error)
    throw error
  }
}

export const generateProposalPDFWithSaveDialog = generatePublicProposalPDFWithSaveDialog

export interface ReportData {
  title: string
  startDate?: string
  endDate?: string
  summary?: string
  sections: {
    title: string
    content?: string
    data?: { label: string; value: string }[]
  }[]
}

export async function generateReportPDF(reportData: ReportData, returnBase64 = false): Promise<string | void> {
  try {
    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

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

    // Header with company branding
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.rect(0, 0, pageWidth, 25, "F")

    // Add white text for header
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(20)
    pdf.setFont("helvetica", "bold")
    pdf.text("REPORT", margin, 15)

    // Add date
    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 15)

    yPosition = 35
    pdf.setTextColor(0, 0, 0)

    // Report Title
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text(reportData.title || "Report", margin, yPosition)
    yPosition += 15

    // Report period
    if (reportData.startDate && reportData.endDate) {
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Period: ${reportData.startDate} - ${reportData.endDate}`, margin, yPosition)
      yPosition += 10
    }

    // Report content
    if (reportData.summary) {
      checkNewPage(30)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("SUMMARY", margin, yPosition)
      yPosition += 8

      pdf.setLineWidth(0.5)
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(reportData.summary, margin, yPosition, contentWidth)
      yPosition += 15
    }

    // Report data sections
    if (reportData.sections && reportData.sections.length > 0) {
      reportData.sections.forEach((section) => {
        checkNewPage(40)

        pdf.setFontSize(16)
        pdf.setFont("helvetica", "bold")
        pdf.text(section.title.toUpperCase(), margin, yPosition)
        yPosition += 8

        pdf.setLineWidth(0.5)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        pdf.setFontSize(11)
        pdf.setFont("helvetica", "normal")

        if (section.content) {
          yPosition = addText(section.content, margin, yPosition, contentWidth)
          yPosition += 10
        }

        // Add section data if available
        if (section.data && Array.isArray(section.data)) {
          section.data.forEach((item, index) => {
            checkNewPage(15)
            pdf.setFont("helvetica", "bold")
            pdf.text(`${index + 1}. ${item.label || "Item"}:`, margin, yPosition)
            pdf.setFont("helvetica", "normal")
            pdf.text(item.value || "N/A", margin + 40, yPosition)
            yPosition += 6
          })
        }

        yPosition += 10
      })
    }

    // Footer
    checkNewPage(30)
    yPosition = pageHeight - 40

    // Footer separator
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Footer content
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(100, 100, 100)

    pdf.text("Generated by OH Plus Platform", margin, yPosition)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPosition + 5)

    // Company info on the right
    pdf.text("Smart. Seamless. Scalable.", pageWidth - margin - 50, yPosition)
    pdf.setFont("helvetica", "bold")
    pdf.text("OH+", pageWidth - margin - 15, yPosition + 5)

    if (returnBase64) {
      // Return base64 string for email attachment
      return pdf.output("datauristring").split(",")[1]
    } else {
      // Save the PDF for download
      const fileName = `report-${(reportData.title || "report").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Report PDF:", error)
    throw new Error("Failed to generate Report PDF")
  }
}
