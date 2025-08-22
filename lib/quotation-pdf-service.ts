import { jsPDF } from "jspdf"
import type { Quotation } from "@/lib/types/quotation"

// Helper function to load image and convert to base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

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

// Helper function to generate QR code
async function generateQRCode(text: string): Promise<string> {
  try {
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
  return new Date()
}

// Helper function to safely convert to string
const safeString = (value: any): string => {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "boolean") return value.toString()
  if (value && typeof value === "object") {
    if (value.id) return value.id.toString()
    if (value.toString) return value.toString()
    return "N/A"
  }
  return String(value)
}

// Helper to format date
const formatDate = (date: any) => {
  if (!date) return "N/A"
  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj)
  } catch (error) {
    return "Invalid Date"
  }
}

/**
 * Generate quotation PDF matching the exact layout from sales/quotations page
 */
export async function generateQuotationPDF(quotation: Quotation): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // Process each product on a separate page
  const products = quotation.items || []

  for (let productIndex = 0; productIndex < products.length; productIndex++) {
    const product = products[productIndex]

    if (productIndex > 0) {
      pdf.addPage()
    }

    let yPosition = margin

    // Header Section - Client and RFQ info
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text(safeString(quotation.client_name), margin, yPosition)
    yPosition += 5

    pdf.setFont("helvetica", "normal")
    pdf.text(safeString(quotation.client_company_name) || "JMCL MEDIA & MARKETING SERVICES INC.", margin, yPosition)

    // RFQ Number (top right)
    pdf.text(`RFQ. No. ${quotation.quotation_number}`, pageWidth - margin - 40, yPosition - 5)
    yPosition += 15

    // Company Header
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    const companyName = "GOLDEN TOUCH IMAGING SPECIALIST"
    const companyNameWidth = pdf.getTextWidth(companyName)
    pdf.text(companyName, (pageWidth - companyNameWidth) / 2, yPosition)
    yPosition += 10

    // Greeting message
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")
    const greeting1 = "Good Day! Thank you for considering Golden Touch for your business needs."
    const greeting2 = "We are pleased to submit our quotation for your requirements:"

    const greeting1Width = pdf.getTextWidth(greeting1)
    const greeting2Width = pdf.getTextWidth(greeting2)

    pdf.text(greeting1, (pageWidth - greeting1Width) / 2, yPosition)
    yPosition += 5
    pdf.text(greeting2, (pageWidth - greeting2Width) / 2, yPosition)
    yPosition += 10

    // "Details as follows:"
    pdf.setFont("helvetica", "bold")
    pdf.text("Details as follows:", margin, yPosition)
    yPosition += 10

    // Product Details Section
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    const bulletPoints = [
      { label: "● Site Location:", value: safeString(product.location) },
      { label: "● Type:", value: safeString(product.type) },
      { label: "● Size:", value: safeString(product.dimensions) || "100ft (H) x 60ft (W)" },
      { label: "● Contract Duration:", value: `${safeString(product.duration_days)} DAYS` },
      {
        label: "● Contract Period:",
        value: `${formatDate(quotation.start_date)} - ${formatDate(quotation.end_date)}`,
      },
      {
        label: "● Proposal to:",
        value: safeString(quotation.client_company_name) || safeString(quotation.client_name),
      },
      {
        label: "● Illumination:",
        value: safeString(product.illumination) || "10 units of 1000 watts metal Halide",
      },
      { label: "● Lease Rate/Month:", value: "(Exclusive of VAT)" },
      { label: "● Total Lease:", value: "(Exclusive of VAT)" },
    ]

    bulletPoints.forEach((point) => {
      pdf.setFont("helvetica", "normal")
      pdf.text(point.label, margin, yPosition)
      pdf.setFont("helvetica", "bold")
      pdf.text(point.value, margin + 45, yPosition)
      yPosition += 6
    })

    yPosition += 10

    // Pricing Table
    const tableStartY = yPosition
    const rowHeight = 8
    const col1Width = contentWidth * 0.7
    const col2Width = contentWidth * 0.3

    // Table data
    const monthlyRate = Number(product.price || 0)
    const months = Math.ceil((Number(product.duration_days) || 30) / 30)
    const subtotal = Number(product.item_total_amount || 0)
    const vatAmount = subtotal * 0.12
    const total = subtotal + vatAmount

    const tableData = [
      { label: "Lease rate per month", value: `₱${monthlyRate.toLocaleString()}.00` },
      { label: `x ${months} months`, value: `₱${subtotal.toLocaleString()}.00` },
      { label: "12% VAT", value: `₱${vatAmount.toLocaleString()}.00` },
      { label: "TOTAL", value: `₱${total.toLocaleString()}.00`, isTotal: true },
    ]

    tableData.forEach((row, index) => {
      const currentY = tableStartY + index * rowHeight

      // Draw cell borders
      pdf.setLineWidth(0.5)
      pdf.setDrawColor(0, 0, 0)
      pdf.rect(margin, currentY, col1Width, rowHeight)
      pdf.rect(margin + col1Width, currentY, col2Width, rowHeight)

      // Fill total row with gray background
      if (row.isTotal) {
        pdf.setFillColor(240, 240, 240)
        pdf.rect(margin, currentY, contentWidth, rowHeight, "F")
        pdf.rect(margin, currentY, contentWidth, rowHeight)
      }

      // Add text
      pdf.setFont("helvetica", row.isTotal ? "bold" : "normal")
      pdf.text(row.label, margin + 2, currentY + 5)
      pdf.text(row.value, margin + col1Width + col2Width - 2, currentY + 5, { align: "right" })
    })

    yPosition = tableStartY + tableData.length * rowHeight + 10

    // Note
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    pdf.text(`Note: free two (2) change material for ${months} month rental`, margin, yPosition)
    yPosition += 15

    // Terms and Conditions
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text("Terms and Conditions:", margin, yPosition)
    yPosition += 8

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    const terms = [
      "1. Quotation validity: 5 working days.",
      "2. Availability of the site is on first-come-first-served-basis only. Only official documents such as P.O's,",
      "    Media Orders, signed quotation, & contracts are accepted in order to book the site.",
      "3. To book the site, one (1) month advance and one (2) months security deposit",
      "    payment dated 7 days before the start of rental is required.",
      "4. Final artwork should be approved ten (10) days before the contract period",
      "5. Print is exclusively for Golden Touch Imaging Specialist Only.",
    ]

    terms.forEach((term) => {
      pdf.text(term, margin, yPosition)
      yPosition += 6
    })

    yPosition += 15

    // Signature Section
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Left side - Very truly yours
    pdf.text("Very truly yours,", margin, yPosition)
    // Right side - Conforme
    pdf.text("C o n f o r m e:", margin + contentWidth / 2, yPosition)
    yPosition += 20

    // Signature lines
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, margin + 60, yPosition)
    pdf.line(margin + contentWidth / 2, yPosition, margin + contentWidth / 2 + 60, yPosition)
    yPosition += 6

    // Names
    pdf.text("Mathew Espanto", margin, yPosition)
    pdf.text(safeString(quotation.client_name), margin + contentWidth / 2, yPosition)
    yPosition += 6

    // Titles
    pdf.text("Account Management", margin, yPosition)
    pdf.text(
      safeString(quotation.client_company_name) || "JMCL MEDIA & MARKETING SERVICES INC.",
      margin + contentWidth / 2,
      yPosition,
    )
    yPosition += 10

    // Billing note (right side only)
    pdf.setFontSize(9)
    pdf.text("This signed Quotation serves as an", margin + contentWidth / 2, yPosition)
    yPosition += 4
    pdf.text("official document for billing purposes", margin + contentWidth / 2, yPosition)
    yPosition += 15

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text(
      "No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53",
      margin,
      pageHeight - 20,
    )
    pdf.text("email: sales@goldentouchimaging.com or gtigolden@gmail.com", margin, pageHeight - 15)

    // Date and location
    pdf.setTextColor(0, 0, 0)
    pdf.setFont("helvetica", "normal")
    pdf.text(formatDate(new Date()), margin, pageHeight - 10)
    pdf.setFont("helvetica", "bold")
    pdf.text(`${safeString(product.location)} QUOTATION`, margin, pageHeight - 5)
  }

  // Download the PDF
  pdf.save(`Quotation-${quotation.quotation_number}.pdf`)
}
