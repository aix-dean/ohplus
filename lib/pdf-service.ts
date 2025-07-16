import jsPDF from "jspdf"
import QRCode from "qrcode"
import type { ReportData } from "@/lib/report-service"

interface ProposalData {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  client_company: string
  client_industry: string
  client_designation?: string
  products: Array<{
    id: string
    name: string
    site_code: string
    type: string
    specs_rental: {
      width: number
      height: number
      location: string
      price_per_month: number
    }
    media?: Array<{ url: string }>
  }>
  total_amount: number
  created_at: any
  valid_until: any
  proposal_number?: string
}

interface CostEstimateData {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  client_company: string
  client_industry: string
  client_designation?: string
  products: Array<{
    id: string
    name: string
    site_code: string
    type: string
    specs_rental: {
      width: number
      height: number
      location: string
      price_per_month: number
    }
    media?: Array<{ url: string }>
  }>
  total_amount: number
  created_at: any
  valid_until: any
  estimate_number?: string
}

// Helper function to load image and convert to base64
export async function loadImageAsBase64(url: string): Promise<string | null> {
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

// Helper function to format currency without +/- symbols
const formatCurrency = (amount: any): string => {
  if (!amount && amount !== 0) return "0"

  try {
    // Convert to string and remove any non-numeric characters except decimal point
    const cleanAmount = amount.toString().replace(/[^\d.-]/g, "")
    const numAmount = Number.parseFloat(cleanAmount)

    if (isNaN(numAmount)) return "0"

    // Use absolute value to ensure no negative signs
    return Math.abs(numAmount).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  } catch (error) {
    console.error("Error formatting currency:", error)
    return "0"
  }
}

export class PDFService {
  private formatCurrency(amount: any): string {
    if (!amount && amount !== 0) return "0"

    try {
      let numAmount: number

      if (typeof amount === "number") {
        numAmount = amount
      } else if (typeof amount === "string") {
        // Remove any non-numeric characters including ± symbols
        const cleanAmount = amount.replace(/[^\d.-]/g, "")
        numAmount = Number.parseFloat(cleanAmount)
      } else {
        return "0"
      }

      if (isNaN(numAmount)) return "0"

      // Use absolute value to remove any negative signs or ± symbols
      const absAmount = Math.abs(numAmount)
      return absAmount.toLocaleString()
    } catch (error) {
      console.error("Error formatting currency:", error)
      return "0"
    }
  }

  private formatDate(date: any): string {
    if (!date) return "N/A"

    try {
      let dateObj: Date

      if (date && typeof date.toDate === "function") {
        dateObj = date.toDate()
      } else if (typeof date === "string") {
        dateObj = new Date(date)
      } else if (date instanceof Date) {
        dateObj = date
      } else {
        return "N/A"
      }

      if (isNaN(dateObj.getTime())) {
        return "N/A"
      }

      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })
    } catch (error) {
      return "N/A"
    }
  }

  async generateProposalPDF(data: ProposalData): Promise<Uint8Array> {
    const doc = new jsPDF()
    const margin = 20
    const pageWidth = doc.internal.pageSize.width
    const contentWidth = pageWidth - margin * 2

    // Generate QR code
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${data.id}`
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: 80 })

    // Header with QR code
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("PROPOSAL", margin, 30)

    // Add QR code with proper spacing
    const qrSize = 20
    const qrX = pageWidth - margin - qrSize
    const qrY = 15
    doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize)

    // Subtitle with better spacing from QR code
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const subtitleWidth = contentWidth - qrSize - 25 // 25mm buffer from QR code
    const subtitle = `Proposal for ${data.client_company} - ${this.formatDate(data.created_at)}`
    doc.text(subtitle, margin, 45, { maxWidth: subtitleWidth })

    // Date information
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Created: ${this.formatDate(data.created_at)}`, margin, 55)
    doc.text(`Valid Until: ${this.formatDate(data.valid_until)}`, margin, 62)

    // QR code label
    doc.setFontSize(8)
    doc.text("Scan to view online", qrX, qrY + qrSize + 5)

    // Reset text color
    doc.setTextColor(0, 0, 0)

    // Client Information Section
    let yPos = 80
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CLIENT INFORMATION", margin, yPos)

    // Draw line under section header
    doc.setLineWidth(0.5)
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)

    yPos += 15
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    // Client details in two columns
    const leftColX = margin
    const rightColX = margin + contentWidth / 2

    doc.setFont("helvetica", "bold")
    doc.text("Company:", leftColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_company || "N/A", leftColX + 25, yPos)

    doc.setFont("helvetica", "bold")
    doc.text("Contact Person:", rightColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_name || "N/A", rightColX + 35, yPos)

    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.text("Email:", leftColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_email || "N/A", leftColX + 25, yPos)

    doc.setFont("helvetica", "bold")
    doc.text("Phone:", rightColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_phone || "N/A", rightColX + 35, yPos)

    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.text("Industry:", leftColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_industry || "N/A", leftColX + 25, yPos)

    // Add designation if available
    if (data.client_designation) {
      doc.setFont("helvetica", "bold")
      doc.text("Designation:", rightColX, yPos)
      doc.setFont("helvetica", "normal")
      doc.text(data.client_designation, rightColX + 35, yPos)
    }

    // Products & Services Section
    yPos += 25
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("PRODUCTS & SERVICES", margin, yPos)

    doc.setLineWidth(0.5)
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)

    yPos += 15

    // Product details
    data.products.forEach(async (product, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 30
      }

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`${index + 1}. ${product.name}`, margin, yPos)

      // Price aligned to the right
      const priceText = `₱${this.formatCurrency(product.specs_rental.price_per_month)}`
      const priceWidth = doc.getTextWidth(priceText)
      doc.text(priceText, pageWidth - margin - priceWidth, yPos)

      yPos += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      const details = [
        `Rental: N/A`,
        `Site Code: ${product.site_code || "N/A"}`,
        `Dimensions: ${product.specs_rental.width || "N/A"}ft x ${product.specs_rental.height || "N/A"}ft`,
        `Location: ${product.specs_rental.location || "N/A"}`,
      ]

      details.forEach((detail) => {
        doc.text(detail, margin + 5, yPos)
        yPos += 6
      })

      // Product images
      if (product.media && product.media.length > 0) {
        yPos += 5
        doc.setFont("helvetica", "bold")
        doc.text("Product Images:", margin + 5, yPos)
        yPos += 10

        const imageWidth = 60
        const imageHeight = 40
        const imagesPerRow = 2
        let imageX = margin + 10

        for (let i = 0; i < Math.min(product.media.length, 4); i++) {
          try {
            if (i > 0 && i % imagesPerRow === 0) {
              yPos += imageHeight + 10
              imageX = margin + 10
            }

            // Check if we need a new page for images
            if (yPos + imageHeight > 280) {
              doc.addPage()
              yPos = 30
              imageX = margin + 10
            }

            const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(product.media[i].url)}`)
            if (response.ok) {
              const blob = await response.blob()
              const reader = new FileReader()

              await new Promise((resolve) => {
                reader.onload = () => {
                  try {
                    doc.addImage(reader.result as string, "JPEG", imageX, yPos, imageWidth, imageHeight)
                  } catch (error) {
                    console.error("Error adding image to PDF:", error)
                  }
                  resolve(null)
                }
                reader.readAsDataURL(blob)
              })
            }

            imageX += imageWidth + 10
          } catch (error) {
            console.error("Error processing image:", error)
          }
        }

        yPos += imageHeight + 15
      } else {
        yPos += 15
      }
    })

    // Proposal Summary
    yPos += 10

    // Check if we need a new page for summary
    if (yPos > 250) {
      doc.addPage()
      yPos = 30
    }

    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)

    yPos += 15
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("PROPOSAL SUMMARY", margin, yPos)

    yPos += 15
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Products: ${data.products.length}`, margin + 5, yPos)

    yPos += 15

    // Total amount box
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos - 5, contentWidth, 15, "F")

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    const totalText = `TOTAL AMOUNT: ₱${this.formatCurrency(data.total_amount)}`
    doc.text(totalText, margin + 5, yPos + 5)

    return doc.output("arraybuffer")
  }

  async generateCostEstimatePDF(data: CostEstimateData): Promise<Uint8Array> {
    const doc = new jsPDF()
    const margin = 20
    const pageWidth = doc.internal.pageSize.width
    const contentWidth = pageWidth - margin * 2

    // Generate QR code
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${data.id}`
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: 80 })

    // Header with QR code
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("COST ESTIMATE", margin, 30)

    // Add QR code with proper spacing
    const qrSize = 20
    const qrX = pageWidth - margin - qrSize
    const qrY = 15
    doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize)

    // Subtitle with better spacing from QR code
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const subtitleWidth = contentWidth - qrSize - 25 // 25mm buffer from QR code
    const subtitle = `Cost Estimate for ${data.client_company} - ${this.formatDate(data.created_at)}`
    doc.text(subtitle, margin, 45, { maxWidth: subtitleWidth })

    // Date information
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Created: ${this.formatDate(data.created_at)}`, margin, 55)
    doc.text(`Valid Until: ${this.formatDate(data.valid_until)}`, margin, 62)

    // QR code label
    doc.setFontSize(8)
    doc.text("Scan to view online", qrX, qrY + qrSize + 5)

    // Reset text color
    doc.setTextColor(0, 0, 0)

    // Client Information Section
    let yPos = 80
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CLIENT INFORMATION", margin, yPos)

    // Draw line under section header
    doc.setLineWidth(0.5)
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)

    yPos += 15
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    // Client details in two columns
    const leftColX = margin
    const rightColX = margin + contentWidth / 2

    doc.setFont("helvetica", "bold")
    doc.text("Company:", leftColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_company || "N/A", leftColX + 25, yPos)

    doc.setFont("helvetica", "bold")
    doc.text("Contact Person:", rightColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_name || "N/A", rightColX + 35, yPos)

    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.text("Email:", leftColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_email || "N/A", leftColX + 25, yPos)

    doc.setFont("helvetica", "bold")
    doc.text("Phone:", rightColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_phone || "N/A", rightColX + 35, yPos)

    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.text("Industry:", leftColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.client_industry || "N/A", leftColX + 25, yPos)

    // Add designation if available
    if (data.client_designation) {
      doc.setFont("helvetica", "bold")
      doc.text("Designation:", rightColX, yPos)
      doc.setFont("helvetica", "normal")
      doc.text(data.client_designation, rightColX + 35, yPos)
    }

    // Products & Services Section
    yPos += 25
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("PRODUCTS & SERVICES", margin, yPos)

    doc.setLineWidth(0.5)
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)

    yPos += 15

    // Product details
    data.products.forEach(async (product, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 30
      }

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`${index + 1}. ${product.name}`, margin, yPos)

      // Price aligned to the right
      const priceText = `₱${this.formatCurrency(product.specs_rental.price_per_month)}`
      const priceWidth = doc.getTextWidth(priceText)
      doc.text(priceText, pageWidth - margin - priceWidth, yPos)

      yPos += 8
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      const details = [
        `Rental: N/A`,
        `Site Code: ${product.site_code || "N/A"}`,
        `Dimensions: ${product.specs_rental.width || "N/A"}ft x ${product.specs_rental.height || "N/A"}ft`,
        `Location: ${product.specs_rental.location || "N/A"}`,
      ]

      details.forEach((detail) => {
        doc.text(detail, margin + 5, yPos)
        yPos += 6
      })

      // Product images
      if (product.media && product.media.length > 0) {
        yPos += 5
        doc.setFont("helvetica", "bold")
        doc.text("Product Images:", margin + 5, yPos)
        yPos += 10

        const imageWidth = 60
        const imageHeight = 40
        const imagesPerRow = 2
        let imageX = margin + 10

        for (let i = 0; i < Math.min(product.media.length, 4); i++) {
          try {
            if (i > 0 && i % imagesPerRow === 0) {
              yPos += imageHeight + 10
              imageX = margin + 10
            }

            // Check if we need a new page for images
            if (yPos + imageHeight > 280) {
              doc.addPage()
              yPos = 30
              imageX = margin + 10
            }

            const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(product.media[i].url)}`)
            if (response.ok) {
              const blob = await response.blob()
              const reader = new FileReader()

              await new Promise((resolve) => {
                reader.onload = () => {
                  try {
                    doc.addImage(reader.result as string, "JPEG", imageX, yPos, imageWidth, imageHeight)
                  } catch (error) {
                    console.error("Error adding image to PDF:", error)
                  }
                  resolve(null)
                }
                reader.readAsDataURL(blob)
              })
            }

            imageX += imageWidth + 10
          } catch (error) {
            console.error("Error processing image:", error)
          }
        }

        yPos += imageHeight + 15
      } else {
        yPos += 15
      }
    })

    // Cost Estimate Summary
    yPos += 10

    // Check if we need a new page for summary
    if (yPos > 250) {
      doc.addPage()
      yPos = 30
    }

    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)

    yPos += 15
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("COST ESTIMATE SUMMARY", margin, yPos)

    yPos += 15
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Products: ${data.products.length}`, margin + 5, yPos)

    yPos += 15

    // Total amount box
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos - 5, contentWidth, 15, "F")

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    const totalText = `TOTAL AMOUNT: ₱${this.formatCurrency(data.total_amount)}`
    doc.text(totalText, margin + 5, yPos + 5)

    return doc.output("arraybuffer")
  }
}

export const pdfService = new PDFService()

export const generateProposalPDF = async (proposal: any, products: any[]) => {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const contentWidth = pageWidth - margin * 2

  let yPosition = margin

  // Generate QR Code
  const proposalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.id}`
  const qrCodeDataUrl = await QRCode.toDataURL(proposalUrl, { width: 100 })

  // Header Section with improved spacing
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("PROPOSAL", margin, yPosition)

  // Position QR code with proper spacing from title
  const qrSize = 20
  const qrX = pageWidth - margin - qrSize
  const qrY = yPosition - 5
  doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize)

  yPosition += 15

  // Proposal subtitle
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  const proposalTitle = `Proposal for ${proposal.clientName} - ${new Date(proposal.created?.toDate?.() || proposal.created).toLocaleDateString()}`
  doc.text(proposalTitle, margin, yPosition)
  yPosition += 8

  // Created and Valid Until dates
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Created: ${new Date(proposal.created?.toDate?.() || proposal.created).toLocaleDateString()}`,
    margin,
    yPosition,
  )
  yPosition += 5
  doc.text(
    `Valid Until: ${new Date(proposal.validUntil?.toDate?.() || proposal.validUntil).toLocaleDateString()}`,
    margin,
    yPosition,
  )
  yPosition += 15

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Client Information Section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("CLIENT INFORMATION", margin, yPosition)
  yPosition += 5

  // Draw line under section header
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Client details in two columns
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")

  const leftColumnX = margin
  const rightColumnX = pageWidth / 2 + 10

  // Left column
  doc.text("Company:", leftColumnX, yPosition)
  doc.setFont("helvetica", "normal")
  doc.text(proposal.clientCompany || "N/A", leftColumnX + 25, yPosition)

  doc.setFont("helvetica", "bold")
  doc.text("Email:", leftColumnX, yPosition + 8)
  doc.setFont("helvetica", "normal")
  doc.text(proposal.clientEmail || "N/A", leftColumnX + 25, yPosition + 8)

  doc.setFont("helvetica", "bold")
  doc.text("Industry:", leftColumnX, yPosition + 16)
  doc.setFont("helvetica", "normal")
  doc.text(proposal.clientIndustry || "N/A", leftColumnX + 25, yPosition + 16)

  // Add designation field
  doc.setFont("helvetica", "bold")
  doc.text("Designation:", leftColumnX, yPosition + 24)
  doc.setFont("helvetica", "normal")
  doc.text(proposal.clientDesignation || "N/A", leftColumnX + 25, yPosition + 24)

  // Right column
  doc.setFont("helvetica", "bold")
  doc.text("Contact Person:", rightColumnX, yPosition)
  doc.setFont("helvetica", "normal")
  doc.text(proposal.clientName || "N/A", rightColumnX + 35, yPosition)

  doc.setFont("helvetica", "bold")
  doc.text("Phone:", rightColumnX, yPosition + 8)
  doc.setFont("helvetica", "normal")
  doc.text(proposal.clientPhone || "N/A", rightColumnX + 35, yPosition + 8)

  yPosition += 40

  // Products & Services Section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("PRODUCTS & SERVICES", margin, yPosition)
  yPosition += 10

  // Process each product
  products.forEach((product, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    // Product header with price
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    const productTitle = `${index + 1}. ${product.name || "Unnamed Product"}`
    doc.text(productTitle, margin, yPosition)

    // Price on the right side - using formatCurrency to remove ± symbols
    const price = formatCurrency(product.price || 0)
    doc.text(`₱${price}`, pageWidth - margin - 30, yPosition)
    yPosition += 8

    // Product details
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    if (product.content_type) {
      doc.text(`Type: ${product.content_type}`, margin + 5, yPosition)
      yPosition += 5
    }

    if (product.site_code) {
      doc.text(`Site Code: ${product.site_code}`, margin + 5, yPosition)
      yPosition += 5
    }

    if (product.specs_rental?.width && product.specs_rental?.height) {
      doc.text(`Dimensions: ${product.specs_rental.width}ft x ${product.specs_rental.height}ft`, margin + 5, yPosition)
      yPosition += 5
    }

    if (product.specs_rental?.location) {
      const locationText = `Location: ${product.specs_rental.location}`
      const splitLocation = doc.splitTextToSize(locationText, contentWidth - 10)
      doc.text(splitLocation, margin + 5, yPosition)
      yPosition += splitLocation.length * 5
    }

    yPosition += 5

    // Product Images
    if (product.media && product.media.length > 0) {
      doc.setFont("helvetica", "bold")
      doc.text("Product Images:", margin + 5, yPosition)
      yPosition += 8

      const imageWidth = 60
      const imageHeight = 45
      const imagesPerRow = 2
      const imageSpacing = 10

      for (let i = 0; i < Math.min(product.media.length, 4); i++) {
        const media = product.media[i]
        if (media.url) {
          try {
            const row = Math.floor(i / imagesPerRow)
            const col = i % imagesPerRow
            const imageX = margin + 10 + col * (imageWidth + imageSpacing)
            const imageY = yPosition + row * (imageHeight + imageSpacing)

            // Check if we need a new page for images
            if (imageY + imageHeight > pageHeight - margin) {
              doc.addPage()
              yPosition = margin
              const newImageY = yPosition + row * (imageHeight + imageSpacing)
              doc.addImage(media.url, "JPEG", imageX, newImageY, imageWidth, imageHeight)
            } else {
              doc.addImage(media.url, "JPEG", imageX, imageY, imageWidth, imageHeight)
            }
          } catch (error) {
            console.error("Error adding image to PDF:", error)
          }
        }
      }

      // Adjust yPosition based on number of image rows
      const imageRows = Math.ceil(Math.min(product.media.length, 4) / imagesPerRow)
      yPosition += imageRows * (imageHeight + imageSpacing) + 10
    }

    yPosition += 10
  })

  // Proposal Summary Section
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = margin
  }

  // Add some space before summary
  yPosition += 10

  // Draw separator line
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("PROPOSAL SUMMARY", margin, yPosition)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`Total Products: ${products.length}`, margin + 5, yPosition)
  yPosition += 15

  // Total Amount - highlighted box without ± symbols
  const totalAmount = products.reduce((sum, product) => {
    const price = Number.parseFloat(product.price?.toString().replace(/[^\d.-]/g, "") || "0")
    return sum + (isNaN(price) ? 0 : Math.abs(price))
  }, 0)

  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPosition - 5, contentWidth, 15, "F")

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(`TOTAL AMOUNT: ₱${formatCurrency(totalAmount)}`, margin + 10, yPosition + 5)

  // Add "Scan to view online" text under QR code on first page
  doc.setPage(1)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text("Scan to view online", qrX - 5, qrY + qrSize + 5)

  return doc
}

export const generateCostEstimatePDF = async (costEstimate: any, products: any[]) => {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const contentWidth = pageWidth - margin * 2

  let yPosition = margin

  // Generate QR Code
  const costEstimateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cost-estimates/view/${costEstimate.id}`
  const qrCodeDataUrl = await QRCode.toDataURL(costEstimateUrl, { width: 100 })

  // Header Section
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("COST ESTIMATE", margin, yPosition)

  // Position QR code with proper spacing
  const qrSize = 20
  const qrX = pageWidth - margin - qrSize
  const qrY = yPosition - 5
  doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize)

  yPosition += 15

  // Cost Estimate subtitle
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  const costEstimateTitle = `Cost Estimate for ${costEstimate.clientName} - ${new Date(costEstimate.created?.toDate?.() || costEstimate.created).toLocaleDateString()}`
  doc.text(costEstimateTitle, margin, yPosition)
  yPosition += 8

  // Created date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Created: ${new Date(costEstimate.created?.toDate?.() || costEstimate.created).toLocaleDateString()}`,
    margin,
    yPosition,
  )
  yPosition += 15

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Client Information Section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("CLIENT INFORMATION", margin, yPosition)
  yPosition += 5

  // Draw line under section header
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Client details in two columns
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")

  const leftColumnX = margin
  const rightColumnX = pageWidth / 2 + 10

  // Left column
  doc.text("Company:", leftColumnX, yPosition)
  doc.setFont("helvetica", "normal")
  doc.text(costEstimate.clientCompany || "N/A", leftColumnX + 25, yPosition)

  doc.setFont("helvetica", "bold")
  doc.text("Email:", leftColumnX, yPosition + 8)
  doc.setFont("helvetica", "normal")
  doc.text(costEstimate.clientEmail || "N/A", leftColumnX + 25, yPosition + 8)

  doc.setFont("helvetica", "bold")
  doc.text("Industry:", leftColumnX, yPosition + 16)
  doc.setFont("helvetica", "normal")
  doc.text(costEstimate.clientIndustry || "N/A", leftColumnX + 25, yPosition + 16)

  // Add designation field
  doc.setFont("helvetica", "bold")
  doc.text("Designation:", leftColumnX, yPosition + 24)
  doc.setFont("helvetica", "normal")
  doc.text(costEstimate.clientDesignation || "N/A", leftColumnX + 25, yPosition + 24)

  // Right column
  doc.setFont("helvetica", "bold")
  doc.text("Contact Person:", rightColumnX, yPosition)
  doc.setFont("helvetica", "normal")
  doc.text(costEstimate.clientName || "N/A", rightColumnX + 35, yPosition)

  doc.setFont("helvetica", "bold")
  doc.text("Phone:", rightColumnX, yPosition + 8)
  doc.setFont("helvetica", "normal")
  doc.text(costEstimate.clientPhone || "N/A", rightColumnX + 35, yPosition + 8)

  yPosition += 40

  // Products & Services Section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("PRODUCTS & SERVICES", margin, yPosition)
  yPosition += 10

  // Process each product
  products.forEach((product, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    // Product header with price - using formatCurrency to remove ± symbols
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    const productTitle = `${index + 1}. ${product.name || "Unnamed Product"}`
    doc.text(productTitle, margin, yPosition)

    // Price on the right side
    const price = formatCurrency(product.price || 0)
    doc.text(`₱${price}`, pageWidth - margin - 30, yPosition)
    yPosition += 8

    // Product details
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    if (product.content_type) {
      doc.text(`Type: ${product.content_type}`, margin + 5, yPosition)
      yPosition += 5
    }

    if (product.site_code) {
      doc.text(`Site Code: ${product.site_code}`, margin + 5, yPosition)
      yPosition += 5
    }

    if (product.specs_rental?.width && product.specs_rental?.height) {
      doc.text(`Dimensions: ${product.specs_rental.width}ft x ${product.specs_rental.height}ft`, margin + 5, yPosition)
      yPosition += 5
    }

    if (product.specs_rental?.location) {
      const locationText = `Location: ${product.specs_rental.location}`
      const splitLocation = doc.splitTextToSize(locationText, contentWidth - 10)
      doc.text(splitLocation, margin + 5, yPosition)
      yPosition += splitLocation.length * 5
    }

    yPosition += 10
  })

  // Cost Estimate Summary Section
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = margin
  }

  // Add some space before summary
  yPosition += 10

  // Draw separator line
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("COST ESTIMATE SUMMARY", margin, yPosition)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`Total Products: ${products.length}`, margin + 5, yPosition)
  yPosition += 15

  // Total Amount - highlighted box without ± symbols
  const totalAmount = products.reduce((sum, product) => {
    const price = Number.parseFloat(product.price?.toString().replace(/[^\d.-]/g, "") || "0")
    return sum + (isNaN(price) ? 0 : Math.abs(price))
  }, 0)

  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPosition - 5, contentWidth, 15, "F")

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(`TOTAL AMOUNT: ₱${formatCurrency(totalAmount)}`, margin + 10, yPosition + 5)

  // Add "Scan to view online" text under QR code on first page
  doc.setPage(1)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text("Scan to view online", qrX - 5, qrY + qrSize + 5)

  return doc
}

export async function generateReportPDF(
  report: ReportData,
  product: any,
  returnBase64 = false,
): Promise<string | void> {
  try {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = 0

    const createdAt = safeToDate(report.created || report.date)
    const startDate = safeToDate(report.bookingDates.start)
    const endDate = safeToDate(report.bookingDates.end)

    // Helper function to format date
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * fontSize * 0.3
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - 30) {
        pdf.addPage()
        yPosition = 0
        addHeaderToPage()
      }
    }

    // Helper function to add image to PDF
    const addImageToPDF = async (imageUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) => {
      try {
        const base64 = await loadImageAsBase64(imageUrl)
        if (!base64) return { width: 0, height: 0 }

        const dimensions = await getImageDimensions(base64)
        let { width, height } = dimensions
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
            height = height / aspectRatio
          }
        }

        pdf.addImage(base64, "JPEG", x, y, width, height)
        return { width, height }
      } catch (error) {
        console.error("Error adding image to PDF:", error)
        return { width: 0, height: 0 }
      }
    }

    // Helper function to create the angular header exactly like the page
    const addHeaderToPage = async () => {
      try {
        const headerHeight = 16

        // Main blue section
        pdf.setFillColor(30, 58, 138) // blue-900
        pdf.rect(0, yPosition, pageWidth, headerHeight, "F")

        // Angular cyan section pointing right using polygon
        const cyanlWidth = pageWidth * 0.4
        const startX = pageWidth - cyanlWidth + cyanlWidth * 0.25

        // Create the angular shape using triangles
        pdf.setFillColor(52, 211, 235) // cyan-400

        // First triangle (top part)
        pdf.triangle(startX, yPosition, pageWidth, yPosition, pageWidth, yPosition + headerHeight / 2, "F")

        // Second triangle (bottom part)
        pdf.triangle(
          startX,
          yPosition,
          pageWidth,
          yPosition + headerHeight / 2,
          pageWidth,
          yPosition + headerHeight,
          "F",
        )

        // Third triangle (left connecting part)
        pdf.triangle(
          startX,
          yPosition,
          pageWidth,
          yPosition + headerHeight,
          pageWidth - cyanlWidth,
          yPosition + headerHeight,
          "F",
        )

        // Add "Logistics" text
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(12)
        pdf.setFont("helvetica", "bold")
        pdf.text("Logistics", margin, yPosition + 10)

        yPosition += headerHeight + 5
        pdf.setTextColor(0, 0, 0)
      } catch (error) {
        console.error("Error adding header:", error)
        yPosition += 25
      }
    }

    // Add header to first page
    await addHeaderToPage()

    // Report Title Section with badge and logo
    const badgeWidth = 50
    const badgeHeight = 8

    // Create cyan badge for "Installation Report"
    pdf.setFillColor(52, 211, 235) // cyan-400
    pdf.rect(margin, yPosition, badgeWidth, badgeHeight, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.text("Installation Report", margin + 2, yPosition + 5)
    pdf.setTextColor(0, 0, 0)

    // Add company logo on the right (similar to web page - smaller size)
    const logoContainerSize = 30 // Container size
    const logoX = pageWidth - margin - logoContainerSize
    const logoY = yPosition - 2 // Aligned with badge

    // Load company logo with fallback logic like the preview page
    const companyLogoUrl = "/ohplus-new-logo.png" // Default fallback

    // Try to get company logo from user's company data (same as preview page)
    // This would need to be passed as a parameter or fetched within the function
    // For now, using the default OH+ logo as fallback

    const logoBase64 = await loadImageAsBase64(companyLogoUrl)
    if (logoBase64) {
      // Add white background container for logo (similar to web page)
      pdf.setFillColor(255, 255, 255)
      pdf.rect(logoX - 2, logoY, logoContainerSize + 4, logoContainerSize, "F")

      // Calculate actual dimensions to fit within the container while maintaining aspect ratio
      const { width: actualLogoWidth, height: actualLogoHeight } = await getImageDimensions(logoBase64)

      let finalLogoWidth = logoContainerSize
      let finalLogoHeight = logoContainerSize

      // Adjust dimensions to fit within the container while maintaining aspect ratio
      const logoAspectRatio = actualLogoWidth / actualLogoHeight
      if (logoAspectRatio > 1) {
        // Wider than tall
        finalLogoHeight = logoContainerSize / logoAspectRatio
      } else {
        // Taller than wide or square
        finalLogoWidth = logoContainerSize * logoAspectRatio
      }

      // Center the logo within its container
      const logoOffsetX = (logoContainerSize - finalLogoWidth) / 2
      const logoOffsetY = (logoContainerSize - finalLogoHeight) / 2

      pdf.addImage(logoBase64, "PNG", logoX + logoOffsetX, logoY + logoOffsetY, finalLogoWidth, finalLogoHeight)
    }

    yPosition += badgeHeight + 5

    // "as of" date text
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    pdf.setTextColor(100, 100, 100)
    pdf.text(`as of ${formatDate(report.date)}`, margin, yPosition)
    pdf.setTextColor(0, 0, 0)
    yPosition += 15

    // Project Information Section
    checkNewPage(70)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("Project Information", margin, yPosition)
    yPosition += 8

    // Draw border around project info table
    pdf.setLineWidth(1)
    pdf.setDrawColor(0, 0, 0)
    const tableHeight = 55
    pdf.rect(margin, yPosition, contentWidth, tableHeight)
    yPosition += 5

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    // Helper functions to get data exactly like the web page
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

    // Two column layout for project information
    const leftColumn = margin + 3
    const rightColumn = margin + contentWidth / 2 + 5

    let leftY = yPosition
    let rightY = yPosition

    const leftColumnData = [
      { label: "Site ID:", value: getSiteLocation(product) },
      { label: "Job Order:", value: report.id?.slice(-4).toUpperCase() || "7733" },
      { label: "Job Order Date:", value: formatDate(report.date) },
      { label: "Site:", value: getSiteName(report) },
      { label: "Size:", value: getSiteSize(product) },
      { label: "Start Date:", value: formatDate(report.bookingDates.start) },
      { label: "End Date:", value: formatDate(report.bookingDates.end) },
      {
        label: "Installation Duration:",
        value: `${calculateInstallationDuration(report.bookingDates.start, report.bookingDates.end)} days`,
      },
    ]

    const rightColumnData = [
      { label: "Content:", value: product?.content_type || "Static" },
      { label: "Material Specs:", value: getMaterialSpecs(product) },
      { label: "Crew:", value: `Team ${report.assignedTo || "4"}` },
      { label: "Illumination:", value: getIllumination(product) },
      { label: "Gondola:", value: getGondola(product) },
      { label: "Technology:", value: getTechnology(product) },
      { label: "Sales:", value: report.sales || "N/A" },
    ]

    // Render left column
    leftColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, leftColumn, leftY)
      pdf.setFont("helvetica", "normal")
      const labelWidth = item.label === "Job Order Date:" ? 35 : item.label === "Installation Duration:" ? 45 : 25
      pdf.text(item.value, leftColumn + labelWidth, leftY)
      leftY += 5
    })

    // Render right column
    rightColumnData.forEach((item) => {
      pdf.setFont("helvetica", "bold")
      pdf.text(item.label, rightColumn, rightY)
      pdf.setFont("helvetica", "normal")
      const labelWidth =
        item.label === "Material Specs:"
          ? 35
          : item.label === "Illumination:"
            ? 35
            : item.label === "Technology:"
              ? 35
              : 25
      pdf.text(item.value, rightColumn + labelWidth, rightY)
      rightY += 5
    })

    yPosition += tableHeight + 10

    // Project Status Section
    checkNewPage(30)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("Project Status", margin, yPosition)

    // Status badge - green
    pdf.setFillColor(34, 197, 94) // green-500
    const statusBadgeWidth = 25
    const statusBadgeHeight = 6
    pdf.rect(margin + 90, yPosition - 4, statusBadgeWidth, statusBadgeHeight, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.text(`${report.completionPercentage || 100}%`, margin + 95, yPosition)
    pdf.setTextColor(0, 0, 0)

    yPosition += 15

    // Attachments/Photos Section (2 side by side like in the page)
    if (report.attachments && report.attachments.length > 0) {
      checkNewPage(80)

      const attachmentsToShow = report.attachments.slice(0, 2)
      const imageWidth = (contentWidth - 10) / 2 // Space for 2 images side by side
      const imageHeight = 60

      for (let i = 0; i < attachmentsToShow.length; i++) {
        const attachment = attachmentsToShow[i]
        const currentX = i === 0 ? margin : margin + imageWidth + 10

        // Draw border for attachment box
        pdf.setLineWidth(0.5)
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(currentX, yPosition, imageWidth, imageHeight)

        // Try to add actual image if it's an image file
        if (attachment.fileUrl && attachment.fileName) {
          const extension = attachment.fileName.toLowerCase().split(".").pop()
          if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
            try {
              const { base64, width, height } = await calculateImageFitDimensions(
                attachment.fileUrl,
                imageWidth - 4, // Max width for the image inside the border
                imageHeight - 4, // Max height for the image inside the border
              )

              if (base64) {
                // Calculate x position to center the image within its container
                const centeredX = currentX + (imageWidth - width) / 2
                pdf.addImage(base64, "JPEG", centeredX, yPosition + 2, width, height)
              }
            } catch (error) {
              console.error("Error adding attachment image:", error)
              // Add placeholder text
              pdf.setFontSize(8)
              pdf.text(attachment.fileName, currentX + 5, yPosition + imageHeight / 2)
            }
          } else {
            // Add file name for non-image files
            pdf.setFontSize(8)
            pdf.text(attachment.fileName, currentX + 5, yPosition + imageHeight / 2)
          }
        } else {
          // Placeholder for missing attachment
          pdf.setFontSize(8)
          pdf.setTextColor(100, 100, 100)
          pdf.text(`Project Photo ${i + 1}`, currentX + 5, yPosition + imageHeight / 2)
          pdf.setTextColor(0, 0, 0)
        }
      }

      yPosition += imageHeight + 5

      // Add attachment info below images (like in the page)
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "normal")

      for (let i = 0; i < attachmentsToShow.length; i++) {
        const currentX = i === 0 ? margin : margin + imageWidth + 10

        pdf.setFont("helvetica", "bold")
        pdf.text("Date:", currentX, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatDate(report.date), currentX + 15, yPosition)

        pdf.setFont("helvetica", "bold")
        pdf.text("Time:", currentX, yPosition + 4)
        pdf.setFont("helvetica", "normal")
        pdf.text(
          new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          currentX + 15,
          yPosition + 4,
        )

        pdf.setFont("helvetica", "bold")
        pdf.text("Location:", currentX, yPosition + 8)
        pdf.setFont("helvetica", "normal")
        pdf.text(report.location || "N/A", currentX + 25, yPosition + 8)
      }

      yPosition += 20
    }

    // Footer Section
    checkNewPage(40)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Prepared by section (matching the exact pageview.png format)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    pdf.text("Prepared by:", margin, yPosition)
    yPosition += 6

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(0, 0, 0)

    // Use initials or short name instead of full email
    const preparedByName = report.createdByName || "JP"
    pdf.text(preparedByName, margin, yPosition)
    yPosition += 4

    pdf.text("LOGISTICS", margin, yPosition)
    yPosition += 4

    // Use MM/DD/YY format to match pageview
    const reportDate = new Date(report.date)
    const formattedDate = reportDate.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    pdf.text(formattedDate, margin, yPosition)

    // Disclaimer on the right (matching pageview format exactly)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    pdf.setTextColor(107, 114, 128) // gray color
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    const disclaimer = `"All data are based on the latest available records as of ${currentDate}."`

    // Position disclaimer on the right side, aligned with the date line
    const disclaimerWidth = 120
    pdf.text(disclaimer, pageWidth - margin - disclaimerWidth, yPosition, {
      align: "left",
      maxWidth: disclaimerWidth,
    })

    // Angular Footer (matching the page design)
    const footerY = pageHeight - 12
    const footerHeight = 12

    // Cyan section on left with diagonal cut
    pdf.setFillColor(52, 211, 235) // cyan-400
    const cyanWidth = pageWidth * 0.3
    const diagonalCutWidth = pageWidth * 0.05

    // Draw the main cyan rectangle
    pdf.rect(0, footerY, cyanWidth - diagonalCutWidth, footerHeight, "F")

    // Draw the diagonal part of cyan section
    pdf.triangle(
      cyanWidth - diagonalCutWidth,
      footerY,
      cyanWidth,
      footerY,
      cyanWidth - diagonalCutWidth,
      footerY + footerHeight,
      "F",
    )

    // Angular blue section
    pdf.setFillColor(30, 58, 138) // blue-900
    pdf.rect(cyanWidth, footerY, pageWidth - cyanWidth, footerHeight, "F")

    // Draw the diagonal connecting part
    pdf.triangle(
      cyanWidth - diagonalCutWidth,
      footerY + footerHeight,
      cyanWidth,
      footerY,
      cyanWidth,
      footerY + footerHeight,
      "F",
    )

    // Add footer text
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text("Smart. Seamless. Scalable", pageWidth - margin - 65, footerY + 6)

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("OH!", pageWidth - margin - 15, footerY + 8)

    // Add the "+" symbol
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    pdf.text("+", pageWidth - margin - 5, footerY + 8)

    if (returnBase64) {
      return pdf.output("datauristring").split(",")[1]
    } else {
      const fileName = `report-installation-report-${Date.now()}.pdf`
      pdf.save(fileName)
    }
  } catch (error) {
    console.error("Error generating Report PDF:", error)
    throw new Error("Failed to generate Report PDF")
  }
}
