import jsPDF from "jspdf"
import type { Proposal } from "@/lib/types/proposal"
import type { CostEstimate } from "@/lib/types/cost-estimate"
import type { ReportData } from "@/lib/report-service"
import type { JobOrder } from "@/lib/types/job-order"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

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

            let currentRow = 0
            let currentCol = 0
            let rowStartY = yPosition

            for (let imgIndex = 0; imgIndex < imagesToShow.length; imgIndex++) {
              const media = imagesToShow[imgIndex]

              // Calculate position for current image
              const imageX = margin + 5 + currentCol * (finalImageWidth + imageSpacing)
              const imageY = rowStartY

              // Check if we need a new page for this row
              if (currentCol === 0) {
                checkNewPage(finalImageHeight + 15)
                rowStartY = yPosition
              }

              // Ensure image doesn't exceed right margin
              if (imageX + finalImageWidth > pageWidth - margin) {
                // Start new row if image would exceed margin
                currentRow++
                currentCol = 0
                yPosition = rowStartY + finalImageHeight + imageSpacing
                rowStartY = yPosition

                // Check if we need a new page for the new row
                checkNewPage(finalImageHeight + 15)
                rowStartY = yPosition

                // Recalculate position for new row
                const newImageX = margin + 5 + currentCol * (finalImageWidth + imageSpacing)
                const newImageY = rowStartY

                if (media.url) {
                  try {
                    const base64 = await loadImageAsBase64(media.url)
                    if (base64) {
                      // Use UNIFORM dimensions for ALL images - no aspect ratio calculation
                      pdf.addImage(base64, "JPEG", newImageX, newImageY, finalImageWidth, finalImageHeight)
                    }
                  } catch (error) {
                    console.error("Error adding product image:", error)
                  }
                }
              } else {
                // Add image at current position with UNIFORM dimensions
                if (media.url) {
                  try {
                    const base64 = await loadImageAsBase64(media.url)
                    if (base64) {
                      // Use UNIFORM dimensions for ALL images - no aspect ratio calculation
                      pdf.addImage(base64, "JPEG", imageX, imageY, finalImageWidth, finalImageHeight)
                    }
                  } catch (error) {
                    console.error("Error adding product image:", error)
                  }
                }
              }

              // Move to next column
              currentCol++

              // Check if we need to start a new row
              if (currentCol >= imagesPerRow) {
                currentRow++
                currentCol = 0
                yPosition = rowStartY + finalImageHeight + imageSpacing
                rowStartY = yPosition
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

export async function generateCostEstimatePDF(
  costEstimate: CostEstimate,
  returnBase64 = false,
): Promise<string | void> {
  try {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20 // Increased margin
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    const createdAt = safeToDate(costEstimate.createdAt)
    const validUntil = safeToDate(costEstimate.validUntil)
    const startDate = costEstimate.startDate ? safeToDate(costEstimate.startDate) : null
    const endDate = costEstimate.endDate ? safeToDate(costEstimate.endDate) : null

    const costEstimateViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimate.id}`
    const qrCodeUrl = await generateQRCode(costEstimateViewUrl)

    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * fontSize * 0.3
    }

    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
        addQRCodeToPage()
      }
    }

    const addQRCodeToPage = async () => {
      try {
        const qrSize = 20
        const qrX = pageWidth - margin - qrSize
        const qrY = margin

        const qrBase64 = await loadImageAsBase64(qrCodeUrl)
        if (qrBase64) {
          pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)
          pdf.setFontSize(6)
          pdf.setTextColor(100, 100, 100)
          const textWidth = pdf.getTextWidth("Scan to view online")
          pdf.text("Scan to view online", qrX + (qrSize - textWidth) / 2, qrY + qrSize + 3)
          pdf.setTextColor(0, 0, 0)
        }
      } catch (error) {
        console.error("Error adding QR code to PDF:", error)
      }
    }

    await addQRCodeToPage()

    // Header
    const headerContentWidth = contentWidth - 25
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text("COST ESTIMATE", margin, yPosition)
    yPosition += 12

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "normal")
    const titleLines = pdf.splitTextToSize(costEstimate.title || "Untitled Cost Estimate", headerContentWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 6 + 3

    // Date and validity
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

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    pdf.setFont("helvetica", "bold")
    pdf.text("Company:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.company || "N/A", leftColumn + 25, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Contact Person:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.contactPerson || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.email || "N/A", leftColumn + 25, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.phone || "N/A", rightColumn + 35, yPosition)
    yPosition += 6

    // Add designation for cost estimate too
    pdf.setFont("helvetica", "bold")
    pdf.text("Industry:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(costEstimate.client?.industry || "N/A", leftColumn + 25, yPosition)

    if (costEstimate.client?.designation) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Designation:", rightColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(costEstimate.client.designation, rightColumn + 35, yPosition)
    }
    yPosition += 6

    if (costEstimate.client?.address) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Address:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      yPosition = addText(costEstimate.client.address, leftColumn + 25, yPosition, contentWidth - 25)
      yPosition += 3
    }

    if (startDate) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Start Date:", leftColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(startDate.toLocaleDateString(), leftColumn + 25, yPosition)
      yPosition += 6
    }

    if (endDate) {
      pdf.setFont("helvetica", "bold")
      pdf.text("End Date:", rightColumn, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(endDate.toLocaleDateString(), rightColumn + 35, yPosition)
      yPosition += 6
    }

    yPosition += 8

    // Cost Breakdown Section
    checkNewPage(40)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("COST BREAKDOWN", margin, yPosition)
    yPosition += 6

    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Table Headers
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    pdf.text("Description", margin, yPosition)
    pdf.text("Qty", margin + contentWidth * 0.5, yPosition, { align: "right" })
    pdf.text("Unit Price", margin + contentWidth * 0.75, yPosition, { align: "right" })
    pdf.text("Total", pageWidth - margin, yPosition, { align: "right" })
    yPosition += 6
    pdf.setLineWidth(0.2)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5

    // Line Items
    pdf.setFont("helvetica", "normal")
    costEstimate.lineItems.forEach((item) => {
      checkNewPage(12)
      pdf.setFontSize(10)
      pdf.text(item.description, margin, yPosition)
      pdf.text(item.quantity.toString(), margin + contentWidth * 0.5, yPosition, { align: "right" })
      pdf.text(formatCurrency(item.unitPrice), margin + contentWidth * 0.75, yPosition, { align: "right" })
      pdf.text(formatCurrency(item.total), pageWidth - margin, yPosition, { align: "right" })
      yPosition += 6
      if (item.notes) {
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        yPosition = addText(item.notes, margin + 3, yPosition, contentWidth - 3, 8)
        pdf.setTextColor(0, 0, 0)
      }
      yPosition += 4
    })

    // Total Amount
    checkNewPage(20)
    yPosition += 5
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    const totalText = `TOTAL ESTIMATED COST: ${formatCurrency(costEstimate.totalAmount)}`
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition - 4, contentWidth, 12, "F")
    pdf.text(totalText, margin + 5, yPosition + 3)
    yPosition += 15

    // Notes and Custom Message
    if (costEstimate.notes || costEstimate.customMessage) {
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

      if (costEstimate.notes) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Internal Notes:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(costEstimate.notes, margin, yPosition, contentWidth)
        yPosition += 5
      }

      if (costEstimate.customMessage) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Custom Message:", margin, yPosition)
        pdf.setFont("helvetica", "normal")
        yPosition += 4
        yPosition = addText(costEstimate.customMessage, margin, yPosition, contentWidth)
      }
    }

    // Footer
    const footerY = pageHeight - 15
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text("Generated by OH Plus Platform", margin, footerY)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, footerY)

    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `cost-estimate-${(costEstimate.title || "cost-estimate").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Cost Estimate PDF:", error)
    throw new Error("Failed to generate Cost Estimate PDF")
  }
}

export async function generateReportPDF(
  report: ReportData,
  product: any,
  userData?: any,
  projectData?: any,
  returnBase64 = false,
): Promise<string | void> {
  try {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = 0

    // Helper function to format date exactly like the preview page
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    }

    // Helper function to get report type display
    const getReportTypeDisplay = (type: string) => {
      return type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    // Helper functions matching the preview page exactly
    const getSiteLocation = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.location || product.light?.location || "N/A"
    }

    const getSiteName = (report: any) => {
      return report.siteName || "N/A"
    }

    const getSiteSize = (product: any) => {
      if (!product) return "N/A"
      const specs = product.specs_rental
      if (specs?.height && specs?.width) {
        const panels = specs.panels || "N/A"
        return `${specs.height} (H) x ${specs.width} (W) x ${panels} Panels`
      }
      return product.specs_rental?.size || product.light?.size || "N/A"
    }

    const getMaterialSpecs = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.material || "Stickers"
    }

    const getIllumination = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.illumination || "LR 2097 (200 Watts x 40)"
    }

    const getGondola = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.gondola ? "YES" : "NO"
    }

    const getTechnology = (product: any) => {
      if (!product) return "N/A"
      return product.specs_rental?.technology || "Clear Tapes"
    }

    const calculateInstallationDuration = (startDate: string, endDate: string) => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    // Helper function to get completion percentage from report data
    const getCompletionPercentage = (report: any) => {
      if (!report) return 100

      // Check for installationStatus first (this is the actual field name in the database)
      if (report.installationStatus !== undefined) {
        const percentage = Number.parseInt(report.installationStatus.toString(), 10)
        return isNaN(percentage) ? 0 : percentage
      }

      // Fallback to completionPercentage if it exists
      if (report.completionPercentage !== undefined) {
        return report.completionPercentage
      }

      // Default based on report type
      return report.reportType === "installation-report" ? 0 : 100
    }

    // ANGULAR BLUE HEADER - Exact replica from preview page
    const headerHeight = 16

    // Main blue section (blue-900)
    pdf.setFillColor(30, 58, 138)
    pdf.rect(0, yPosition, pageWidth, headerHeight, "F")

    // Angular cyan section (cyan-400) with clip-path effect
    const cyanStartX = pageWidth * 0.6 // Start at 60% from left
    const cyanPoints = [
      [cyanStartX, yPosition], // Top left of cyan section
      [pageWidth, yPosition], // Top right
      [pageWidth, yPosition + headerHeight], // Bottom right
      [cyanStartX - pageWidth * 0.15, yPosition + headerHeight], // Bottom left with angle
    ]

    pdf.setFillColor(52, 211, 235) // cyan-400
    // Draw the angular cyan section using lines
    pdf.lines(
      cyanPoints.map((point, index) => {
        if (index === 0) return [point[0], point[1]]
        return [point[0] - cyanPoints[0][0], point[1] - cyanPoints[0][1]]
      }),
      cyanPoints[0][0],
      cyanPoints[0][1],
      [1, 1],
      "F",
    )

    // Add "Logistics" text in header
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("Logistics", margin, yPosition + 10)

    yPosition += headerHeight + 8
    pdf.setTextColor(0, 0, 0)

    // REPORT HEADER SECTION - Exact replica
    // Report type badge (cyan-400)
    const badgeText = getReportTypeDisplay(report.reportType)
    const badgeWidth = Math.max(50, pdf.getTextWidth(badgeText) + 12)
    const badgeHeight = 8

    pdf.setFillColor(52, 211, 235) // cyan-400
    pdf.roundedRect(margin, yPosition, badgeWidth, badgeHeight, 2, 2, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    pdf.text(badgeText, margin + 6, yPosition + 5.5)
    pdf.setTextColor(0, 0, 0)

    // Company logo container (160x160px equivalent in mm)
    const logoSize = 35
    const logoX = pageWidth - margin - logoSize
    const logoY = yPosition - 5

    // Resolve company logo and prepared by name
    let companyLogoUrl = "/ohplus-new-logo.png"
    let preparedByName = "User"

    // Query companies collection for logo and name
    if (userData?.uid || report?.createdBy) {
      try {
        const userId = userData?.uid || report?.createdBy
        let companyData = null

        // First, get the full user document to access company_id
        const userDocRef = doc(db, "users", userId)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const fullUserData = userDoc.data()

          // Try to get company using user's company_id
          if (fullUserData.company_id) {
            const companyDocRef = doc(db, "companies", fullUserData.company_id)
            const companyDoc = await getDoc(companyDocRef)

            if (companyDoc.exists()) {
              companyData = companyDoc.data()
            }
          }
        }

        // Fallback: Query by created_by field (for backward compatibility)
        if (!companyData) {
          const companiesRef = collection(db, "companies")
          const q = query(companiesRef, where("created_by", "==", userId))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const companyDoc = querySnapshot.docs[0]
            companyData = companyDoc.data()
          }
        }

        if (companyData) {
          preparedByName =
            companyData.name ||
            companyData.contact_person ||
            companyData.company_name ||
            userData?.displayName ||
            userData?.email?.split("@")[0] ||
            "User"

          if (companyData.photo_url && companyData.photo_url.trim() !== "") {
            companyLogoUrl = companyData.photo_url
          }
        } else {
          preparedByName = userData?.displayName || userData?.email?.split("@")[0] || "User"
        }
      } catch (error) {
        console.error("Error querying companies collection:", error)
        preparedByName = userData?.displayName || userData?.email?.split("@")[0] || "User"
      }
    }

    // Add logo container with white background and shadow
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(logoX - 2, logoY, logoSize + 4, logoSize, 2, 2, "F")
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(255, 255, 255)
    pdf.roundedRect(logoX - 2, logoY, logoSize + 4, logoSize, 2, 2, "S")

    // Load and add logo
    try {
      const logoBase64 = await loadImageAsBase64(companyLogoUrl)
      if (logoBase64) {
        const { width: actualLogoWidth, height: actualLogoHeight } = await getImageDimensions(logoBase64)
        const logoAspectRatio = actualLogoWidth / actualLogoHeight

        let finalLogoWidth = logoSize - 6
        let finalLogoHeight = logoSize - 6

        if (logoAspectRatio > 1) {
          finalLogoHeight = finalLogoWidth / logoAspectRatio
        } else if (logoAspectRatio < 1) {
          finalLogoWidth = finalLogoHeight * logoAspectRatio
        }

        const logoOffsetX = (logoSize - finalLogoWidth) / 2
        const logoOffsetY = (logoSize - finalLogoHeight) / 2

        pdf.addImage(logoBase64, "PNG", logoX + logoOffsetX, logoY + logoOffsetY, finalLogoWidth, finalLogoHeight)
      }
    } catch (error) {
      console.error("Error loading logo:", error)
      // Text fallback
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(100, 100, 100)
      const fallbackText = preparedByName.split(" ")[0] || "Logo"
      const textWidth = pdf.getTextWidth(fallbackText)
      pdf.text(fallbackText, logoX + (logoSize - textWidth) / 2, logoY + logoSize / 2)
      pdf.setTextColor(0, 0, 0)
    }

    yPosition += badgeHeight + 5

    // "as of" date text
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(100, 100, 100)
    pdf.text(`as of ${formatDate(report.date)}`, margin, yPosition)
    pdf.setTextColor(0, 0, 0)
    yPosition += 12

    // PROJECT INFORMATION SECTION - Fixed layout with proper spacing
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(17, 24, 39) // gray-900
    pdf.text("Project Information", margin, yPosition)
    yPosition += 8

    // Card container with shadow effect
    const cardY = yPosition
    const cardHeight = 60 // Increased height to prevent overlapping

    // Shadow effect
    pdf.setFillColor(240, 240, 240)
    pdf.roundedRect(margin + 1, cardY + 1, contentWidth, cardHeight, 2, 2, "F")

    // Main card
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(margin, cardY, contentWidth, cardHeight, 2, 2, "F")
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(230, 230, 230)
    pdf.roundedRect(margin, cardY, contentWidth, cardHeight, 2, 2, "S")

    yPosition += 8

    // Fixed two-column layout with proper spacing to prevent overlapping
    const leftCol = margin + 5
    const rightCol = margin + contentWidth / 2 + 10 // Increased spacing between columns
    const columnWidth = contentWidth / 2 - 15 // Available width for each column
    let leftY = yPosition
    let rightY = yPosition

    pdf.setFontSize(10) // Changed from pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")

    // Left column data with fixed label widths
    const leftColumnData = [
      { label: "Site ID:", value: getSiteLocation(product), labelWidth: 25 },
      { label: "Job Order:", value: report.id?.slice(-4).toUpperCase() || "7733", labelWidth: 25 },
      { label: "Job Order Date:", value: formatDate(report.date), labelWidth: 35 },
      { label: "Site:", value: getSiteName(report), labelWidth: 25 },
      { label: "Size:", value: getSiteSize(product), labelWidth: 25 },
      { label: "Start Date:", value: formatDate(report.bookingDates.start), labelWidth: 25 },
      { label: "End Date:", value: formatDate(report.bookingDates.end), labelWidth: 25 },
      {
        label: "Installation Duration:",
        value: `${calculateInstallationDuration(report.bookingDates.start, report.bookingDates.end)} days`,
        labelWidth: 45,
      },
    ]

    // Right column data with fixed label widths
    const rightColumnData = [
      { label: "Content:", value: product?.content_type || "Static", labelWidth: 25 },
      { label: "Material Specs:", value: getMaterialSpecs(product), labelWidth: 35 },
      { label: "Crew:", value: `Team ${report.assignedTo || "4"}`, labelWidth: 25 },
      { label: "Illumination:", value: getIllumination(product), labelWidth: 30 },
      { label: "Gondola:", value: getGondola(product), labelWidth: 25 },
      { label: "Technology:", value: getTechnology(product), labelWidth: 30 },
      { label: "Sales:", value: report.sales || "N/A", labelWidth: 25 },
    ]

    // Render left column with left alignment and no excess spacing
    leftColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(75, 85, 99) // gray-700
      pdf.text(item.label, leftCol, leftY)

      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(17, 24, 39) // gray-900

      // Left-align value text immediately after label with minimal spacing
      const valueX = leftCol + pdf.getTextWidth(item.label) + 3 // 3mm spacing after label

      // Handle long text with wrapping within available column width
      const availableWidth = rightCol - valueX - 5 // Leave 5mm margin before right column
      const valueLines = pdf.splitTextToSize(item.value, availableWidth)

      if (valueLines.length > 1) {
        // Multi-line text
        valueLines.forEach((line: string, index: number) => {
          pdf.text(line, valueX, leftY + index * 3)
        })
        leftY += (valueLines.length - 1) * 3 + 5
      } else {
        // Single line text
        pdf.text(item.value, valueX, leftY)
        leftY += 5
      }
    })

    // Render right column with left alignment and no excess spacing
    rightColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(75, 85, 99) // gray-700
      pdf.text(item.label, rightCol, rightY)

      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(17, 24, 39) // gray-900

      // Left-align value text immediately after label with minimal spacing
      const valueX = rightCol + pdf.getTextWidth(item.label) + 3 // 3mm spacing after label

      // Handle long text with wrapping within available column width
      const availableWidth = pageWidth - margin - valueX - 5 // Leave 5mm margin from page edge
      const valueLines = pdf.splitTextToSize(item.value, availableWidth)

      if (valueLines.length > 1) {
        // Multi-line text
        valueLines.forEach((line: string, index: number) => {
          pdf.text(line, valueX, rightY + index * 3)
        })
        rightY += (valueLines.length - 1) * 3 + 5
      } else {
        // Single line text
        pdf.text(item.value, valueX, rightY)
        rightY += 5
      }
    })

    yPosition = cardY + cardHeight + 10

    // PROJECT STATUS SECTION - Badge positioned right next to text
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(17, 24, 39) // gray-900
    const statusText = "Project Status"
    pdf.text(statusText, margin, yPosition)

    // Calculate position for badge right next to the text
    const statusTextWidth = pdf.getTextWidth(statusText)
    const badgeX = margin + statusTextWidth + 8 // 8mm spacing after text

    // Status percentage badge with dynamic color
    const statusPercentage = getCompletionPercentage(report)

    // Dynamic color based on percentage
    let badgeColor
    if (statusPercentage >= 90) {
      badgeColor = [34, 197, 94] // green-500
    } else if (statusPercentage >= 70) {
      badgeColor = [234, 179, 8] // yellow-500
    } else if (statusPercentage >= 50) {
      badgeColor = [249, 115, 22] // orange-500
    } else {
      badgeColor = [239, 68, 68] // red-500
    }

    pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2])
    pdf.roundedRect(badgeX, yPosition - 4, 20, 8, 2, 2, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text(`${statusPercentage}%`, badgeX + 5, yPosition + 1)
    pdf.setTextColor(0, 0, 0)

    yPosition += 12

    // ATTACHMENTS SECTION - Two side-by-side images exactly like preview
    if (report.attachments && report.attachments.length > 0) {
      const attachmentsToShow = report.attachments.slice(0, 2)
      const imageContainerWidth = (contentWidth - 10) / 2
      const imageContainerHeight = 45

      for (let i = 0; i < Math.min(2, attachmentsToShow.length); i++) {
        const attachment = attachmentsToShow[i]
        const containerX = i === 0 ? margin : margin + imageContainerWidth + 10

        // Image container with gray background
        pdf.setFillColor(229, 231, 235) // gray-200
        pdf.roundedRect(containerX, yPosition, imageContainerWidth, imageContainerHeight, 2, 2, "F")

        // Try to load and display actual image
        if (attachment.fileUrl && attachment.fileName) {
          const extension = attachment.fileName.toLowerCase().split(".").pop()
          if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
            try {
              const { base64, width, height } = await calculateImageFitDimensions(
                attachment.fileUrl,
                imageContainerWidth - 4,
                imageContainerHeight - 4,
              )

              if (base64) {
                const centeredX = containerX + (imageContainerWidth - width) / 2
                const centeredY = yPosition + (imageContainerHeight - height) / 2
                pdf.addImage(base64, "JPEG", centeredX, centeredY, width, height)
              }
            } catch (error) {
              console.error("Error adding attachment image:", error)
              // Fallback to placeholder
              pdf.setFontSize(8)
              pdf.setTextColor(107, 114, 128)
              pdf.text("Image not available", containerX + 5, yPosition + imageContainerHeight / 2)
            }
          }
        }
      }

      yPosition += imageContainerHeight + 8

      // Image metadata below each image
      for (let i = 0; i < Math.min(2, attachmentsToShow.length); i++) {
        const attachment = attachmentsToShow[i]
        const metaX = i === 0 ? margin : margin + imageContainerWidth + 10

        // Change font size from 7 to 9
        pdf.setFontSize(9) // CHANGED FROM 7 TO 9
        pdf.setTextColor(75, 85, 99) // gray-600

        // Calculate the y-position separately for each column to prevent overlap
        let metaY = yPosition + (i === 0 ? 0 : 0) // Same starting position for both columns

        // Date
        pdf.setFont("helvetica", "bold")
        pdf.text("Date:", metaX, metaY)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatDate(report.date), metaX + 15, metaY)
        metaY += 4 // Increase spacing from 3 to 4

        // Time
        pdf.setFont("helvetica", "bold")
        pdf.text("Time:", metaX, metaY)
        pdf.setFont("helvetica", "normal")
        pdf.text(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), metaX + 15, metaY)
        metaY += 4 // Increase spacing from 3 to 4

        // Location
        pdf.setFont("helvetica", "bold")
        pdf.text("Location:", metaX, metaY)
        pdf.setFont("helvetica", "normal")

        // Handle long location text with wrapping
        const locationText = getSiteLocation(product)
        const availableWidth = imageContainerWidth - 30 // Subtract label width and some margin
        const locationLines = pdf.splitTextToSize(locationText, availableWidth)

        // Add each line of the wrapped location text
        locationLines.forEach((line: string, index: number) => {
          pdf.text(line, metaX + 25, metaY + index * 4)
        })

        // Adjust y position based on number of location lines
        metaY += 4 * (locationLines.length > 1 ? locationLines.length : 1)

        // Note (if available)
        if (attachment.note) {
          pdf.setFont("helvetica", "bold")
          pdf.text("Note:", metaX, metaY)
          pdf.setFont("helvetica", "normal")
          const note = attachment.note.length > 25 ? attachment.note.substring(0, 22) + "..." : attachment.note
          pdf.text(note, metaX + 15, metaY)
        }
      }

      // Also increase the spacing after the metadata section
      yPosition += 18 // Increase from 15 to 18 to accommodate larger text
    }

    // FOOTER SECTION - Fixed layout and positioning
    const footerStartY = pageHeight - 50 // Increased space for footer

    // Footer separator line
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(229, 231, 235) // gray-200
    pdf.line(margin, footerStartY, pageWidth - margin, footerStartY)

    let footerY = footerStartY + 8

    // Prepared by section (left side)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(17, 24, 39) // gray-900
    pdf.text("Prepared by:", margin, footerY)
    footerY += 5

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(75, 85, 99) // gray-600
    pdf.text(preparedByName, margin, footerY)
    footerY += 4

    pdf.text("LOGISTICS", margin, footerY)
    footerY += 4

    pdf.text(formatDate(report.date), margin, footerY)

    // Disclaimer on the right side - Fixed positioning
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "italic")
    pdf.setTextColor(107, 114, 128) // gray-500
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    const disclaimer = `"All data are based on the latest available records as of ${currentDate}."`

    // Position disclaimer properly on the right
    const disclaimerMaxWidth = 120
    const disclaimerX = pageWidth - margin - disclaimerMaxWidth
    const disclaimerLines = pdf.splitTextToSize(disclaimer, disclaimerMaxWidth)

    // Align disclaimer with the "Prepared by" section
    pdf.text(disclaimerLines, disclaimerX, footerStartY + 8, {
      align: "left",
      maxWidth: disclaimerMaxWidth,
    })

    // ANGULAR FOOTER - Fixed design and positioning
    const angularFooterY = pageHeight - 18
    const angularFooterHeight = 18

    // Clear any existing content in footer area
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, angularFooterY, pageWidth, angularFooterHeight, "F")

    // Left cyan section with proper dimensions
    const cyanWidth = pageWidth * 0.3
    const diagonalCutWidth = pageWidth * 0.08

    // Draw cyan rectangle (left side)
    pdf.setFillColor(52, 211, 235) // cyan-400
    pdf.rect(0, angularFooterY, cyanWidth - diagonalCutWidth, angularFooterHeight, "F")

    // Draw diagonal connecting part for cyan
    pdf.triangle(
      cyanWidth - diagonalCutWidth,
      angularFooterY,
      cyanWidth,
      angularFooterY,
      cyanWidth - diagonalCutWidth,
      angularFooterY + angularFooterHeight,
      "F",
    )

    // Right blue section
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.rect(cyanWidth, angularFooterY, pageWidth - cyanWidth, angularFooterHeight, "F")

    // Draw diagonal connecting part for blue
    pdf.triangle(
      cyanWidth - diagonalCutWidth,
      angularFooterY + angularFooterHeight,
      cyanWidth,
      angularFooterY,
      cyanWidth,
      angularFooterY + angularFooterHeight,
      "F",
    )

    // Footer text - properly positioned
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // "Smart. Seamless. Scalable" text
    const taglineText = "Smart. Seamless. Scalable"
    const taglineWidth = pdf.getTextWidth(taglineText)
    pdf.text(taglineText, pageWidth - margin - taglineWidth - 25, angularFooterY + 10)

    // "OH!" text
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    const ohText = "OH!"
    const ohWidth = pdf.getTextWidth(ohText)
    pdf.text(ohText, pageWidth - margin - ohWidth - 8, angularFooterY + 12)

    // "+" symbol in cyan color
    pdf.setTextColor(52, 211, 235) // cyan-400
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "normal")
    pdf.text("+", pageWidth - margin - 3, angularFooterY + 12)

    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `report-${getSiteName(report)
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Report PDF:", error)
    throw new Error("Failed to generate Report PDF")
  }
}
