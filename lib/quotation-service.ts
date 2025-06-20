import { collection, addDoc, serverTimestamp, getDoc, doc, getDocs, query, where, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { addQuotationToCampaign } from "@/lib/campaign-service"
import { jsPDF } from "jspdf"
import { loadImageAsBase64, generateQRCode, getImageDimensions } from "@/lib/pdf-service" // Import getImageDimensions

export interface Quotation {
  id?: string
  quotation_number: string
  quotation_request_id?: string // Add this field
  product_id: string
  product_name: string
  product_location?: string
  site_code?: string
  start_date: string
  end_date: string
  price: number
  total_amount: number
  duration_days: number
  notes?: string
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "viewed" // Added "viewed" for consistency
  created: any
  updated?: any
  created_by?: string
  client_name?: string
  client_email?: string
  campaignId?: string // Add campaign ID field
  proposalId?: string // Add proposal ID field
  valid_until?: any // Added valid_until field
}

// Create a new quotation
export async function createQuotation(quotationData: Omit<Quotation, "id">): Promise<string> {
  try {
    console.log("Creating quotation with data:", quotationData)

    const newQuotation = {
      ...quotationData,
      created: serverTimestamp(),
      updated: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "quotations"), newQuotation)
    console.log("Quotation created with ID:", docRef.id)

    // If there's a campaign ID, add this quotation to the campaign
    if (quotationData.campaignId) {
      try {
        await addQuotationToCampaign(quotationData.campaignId, docRef.id, quotationData.created_by || "system")
      } catch (error) {
        console.error("Error linking quotation to campaign:", error)
        // Don't throw here, as the quotation was created successfully
      }
    }

    return docRef.id
  } catch (error) {
    console.error("Error creating quotation:", error)
    throw new Error("Failed to create quotation: " + error.message)
  }
}

// Get quotation by ID
export async function getQuotationById(quotationId: string): Promise<Quotation | null> {
  try {
    const quotationDoc = await getDoc(doc(db, "quotations", quotationId))

    if (quotationDoc.exists()) {
      return { id: quotationDoc.id, ...quotationDoc.data() } as Quotation
    }

    return null
  } catch (error) {
    console.error("Error fetching quotation:", error)
    return null
  }
}

// Update an existing quotation
export async function updateQuotation(
  quotationId: string,
  updatedData: Partial<Quotation>,
  userId: string,
  userName: string,
): Promise<void> {
  try {
    const quotationRef = doc(db, "quotations", quotationId)
    await updateDoc(quotationRef, {
      ...updatedData,
      updated: serverTimestamp(),
      updated_by: userName, // Or userId if you prefer to store ID
    })
    console.log(`Quotation ${quotationId} updated successfully.`)
  } catch (error) {
    console.error("Error updating quotation:", error)
    throw new Error("Failed to update quotation: " + error.message)
  }
}

// Generate quotation number
export function generateQuotationNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const time = String(now.getTime()).slice(-4)

  return `QT-${year}${month}${day}-${time}`
}

// Calculate total amount based on dates and price
export function calculateQuotationTotal(
  startDate: string,
  endDate: string,
  pricePerDay: number,
): {
  durationDays: number
  totalAmount: number
} {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const totalAmount = Math.max(1, durationDays) * pricePerDay

  return {
    durationDays: Math.max(1, durationDays), // Minimum 1 day
    totalAmount,
  }
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

// Helper to safely convert to string for PDF
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

// Helper function to safely convert to Date (re-using from pdf-service)
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

// Helper function to add image to PDF (copied and adapted from pdf-service)
const addImageToPDF = async (
  pdf: jsPDF,
  imageUrl: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
) => {
  try {
    const base64 = await loadImageAsBase64(imageUrl)
    if (!base64) return { width: 0, height: 0 }

    const dimensions = await getImageDimensions(base64)

    // Calculate scaled dimensions to fit within max bounds
    let { width, height } = dimensions
    const aspectRatio = width / height

    // Scale to fill the maximum available space
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

    pdf.addImage(base64, "JPEG", x, y, width, height)
    return { width, height }
  } catch (error) {
    console.error("Error adding image to PDF:", error)
    return { width: 0, height: 0 }
  }
}

// Generate PDF for quotation
export async function generateQuotationPDF(quotation: Quotation): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Safely convert dates
  const createdDate = safeToDate(quotation.created)
  const validUntilDate = safeToDate(quotation.valid_until)

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text, maxWidth)
    pdf.text(lines, x, y)
    return y + lines.length * fontSize * 0.3 // Adjust line height multiplier
  }

  // Helper function to check if we need a new page
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
      // Add QR code and logo to new page as well
      addHeaderElementsToPage()
    }
  }

  // Helper function to add QR code and logo to current page
  const addHeaderElementsToPage = async () => {
    try {
      const qrSize = 25
      const qrX = pageWidth - margin - qrSize
      const qrY = margin

      // Generate QR Code for quotation view URL
      const quotationViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotation.id}/accept`
      const qrCodeUrl = await generateQRCode(quotationViewUrl)
      const qrBase64 = await loadImageAsBase64(qrCodeUrl)

      if (qrBase64) {
        pdf.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize)
        pdf.setFontSize(6)
        pdf.setTextColor(100, 100, 100)
        pdf.text("Scan to view online", qrX, qrY + qrSize + 3)
        pdf.setTextColor(0, 0, 0)
      }

      // Add Company Logo
      const logoUrl = "/oh-plus-logo.png"
      const logoBase64 = await loadImageAsBase64(logoUrl)
      if (logoBase64) {
        const logoWidth = 30 // Adjust as needed
        const logoHeight = 10 // Adjust as needed
        pdf.addImage(logoBase64, "PNG", margin, margin, logoWidth, logoHeight)
      }
    } catch (error) {
      console.error("Error adding header elements to PDF:", error)
    }
  }

  // Add header elements to first page
  await addHeaderElementsToPage()
  yPosition = Math.max(yPosition, margin + 40) // Ensure content starts below header elements

  // Header (Quotation Title)
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(37, 99, 235) // Blue color
  pdf.text("QUOTATION", margin, yPosition)
  yPosition += 10

  pdf.setFontSize(14)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(0, 0, 0)
  pdf.text(`Quotation No: ${quotation.quotation_number}`, margin, yPosition)
  yPosition += 15

  pdf.setLineWidth(0.3)
  pdf.setDrawColor(37, 99, 235) // Blue line
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Quotation Information Section
  checkNewPage(30)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("QUOTATION INFORMATION", margin, yPosition)
  yPosition += 5
  pdf.setLineWidth(0.2)
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Created Date: ${formatDate(createdDate)}`, margin, yPosition)
  pdf.text(`Valid Until: ${formatDate(validUntilDate)}`, margin + contentWidth / 2, yPosition)
  yPosition += 5
  pdf.text(`Total Amount: ₱${safeString(quotation.total_amount)}`, margin, yPosition)
  yPosition += 10

  // Client Information Section
  checkNewPage(30)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("CLIENT INFORMATION", margin, yPosition)
  yPosition += 5
  pdf.setLineWidth(0.2)
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Client Name: ${safeString(quotation.client_name)}`, margin, yPosition)
  pdf.text(`Client Email: ${safeString(quotation.client_email)}`, margin + contentWidth / 2, yPosition)
  yPosition += 5
  if (quotation.quotation_request_id) {
    pdf.text(`Related Request ID: ${safeString(quotation.quotation_request_id)}`, margin, yPosition)
    yPosition += 5
  }
  if (quotation.proposalId) {
    pdf.text(`Related Proposal ID: ${safeString(quotation.proposalId)}`, margin, yPosition)
    yPosition += 5
  }
  if (quotation.campaignId) {
    pdf.text(`Related Campaign ID: ${safeString(quotation.campaignId)}`, margin, yPosition)
    yPosition += 5
  }
  yPosition += 5

  // Product & Services Section (Manual Table Drawing)
  checkNewPage(50) // Estimate space for table header + one row
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("PRODUCT & SERVICES", margin, yPosition)
  yPosition += 5
  pdf.setLineWidth(0.2)
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  const tableStartY = yPosition
  const cellPadding = 3
  const headerRowHeight = 8
  const dataRowHeight = 12 // Increased for multi-line product name
  const colWidths = [
    contentWidth * 0.4, // Product
    contentWidth * 0.15, // Type
    contentWidth * 0.25, // Location
    contentWidth * 0.2, // Price
  ]

  // Table Headers
  pdf.setFillColor(243, 244, 246) // bg-gray-100
  pdf.rect(margin, yPosition, contentWidth, headerRowHeight, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.1)
  pdf.rect(margin, yPosition, contentWidth, headerRowHeight, "S")

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(75, 85, 99)

  let currentX = margin
  pdf.text("Product", currentX + cellPadding, yPosition + headerRowHeight / 2, { baseline: "middle" })
  currentX += colWidths[0]
  pdf.text("Type", currentX + cellPadding, yPosition + headerRowHeight / 2, { baseline: "middle" })
  currentX += colWidths[1]
  pdf.text("Location", currentX + cellPadding, yPosition + headerRowHeight / 2, { baseline: "middle" })
  currentX += colWidths[2]
  pdf.text("Price", currentX + colWidths[3] - cellPadding, yPosition + headerRowHeight / 2, {
    baseline: "middle",
    align: "right",
  })
  yPosition += headerRowHeight

  // Table Row for Product
  pdf.setFillColor(255, 255, 255) // bg-white
  pdf.rect(margin, yPosition, contentWidth, dataRowHeight, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.rect(margin, yPosition, contentWidth, dataRowHeight, "S")

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(0, 0, 0)

  currentX = margin
  let productText = safeString(quotation.product_name)
  if (quotation.site_code) {
    productText += `\nSite: ${quotation.site_code}`
  }
  addText(productText, currentX + cellPadding, yPosition + cellPadding, colWidths[0] - 2 * cellPadding, 9)
  currentX += colWidths[0]
  pdf.text("Rental", currentX + cellPadding, yPosition + dataRowHeight / 2, { baseline: "middle" })
  currentX += colWidths[1]
  addText(
    safeString(quotation.product_location),
    currentX + cellPadding,
    yPosition + cellPadding,
    colWidths[2] - 2 * cellPadding,
    9,
  )
  currentX += colWidths[2]
  pdf.text(
    `₱${safeString(quotation.price)}/day`,
    currentX + colWidths[3] - cellPadding,
    yPosition + dataRowHeight / 2,
    {
      baseline: "middle",
      align: "right",
    },
  )
  yPosition += dataRowHeight

  // Total Amount Row
  pdf.setFillColor(243, 244, 246) // bg-gray-50
  pdf.rect(margin, yPosition, contentWidth, headerRowHeight, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.rect(margin, yPosition, contentWidth, headerRowHeight, "S")

  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(37, 99, 235) // Blue color

  pdf.text("Total Amount:", margin + colWidths[0] + colWidths[1] + colWidths[2] - 5, yPosition + headerRowHeight / 2, {
    baseline: "middle",
    align: "right",
  })
  pdf.text(
    `₱${safeString(quotation.total_amount)}`,
    pageWidth - margin - cellPadding,
    yPosition + headerRowHeight / 2,
    {
      baseline: "middle",
      align: "right",
    },
  )
  yPosition += headerRowHeight + 15

  // Additional Information (Notes)
  if (quotation.notes) {
    checkNewPage(30)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("ADDITIONAL INFORMATION", margin, yPosition)
    yPosition += 5
    pdf.setLineWidth(0.2)
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    yPosition = addText(quotation.notes, margin, yPosition, contentWidth)
    yPosition += 10
  }

  // Footer
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(107, 114, 128) // Gray color
  pdf.text(`This quotation is valid until ${formatDate(validUntilDate)}`, pageWidth / 2, pageHeight - 20, {
    align: "center",
  })
  pdf.text(
    `© ${new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  )

  // Download the PDF
  pdf.save(`Quotation-${quotation.quotation_number}.pdf`)
}

// Send quotation email to client
export async function sendQuotationEmail(quotation: Quotation, requestorEmail: string): Promise<boolean> {
  try {
    console.log("Sending quotation email:", {
      quotationId: quotation.id,
      quotationNumber: quotation.quotation_number,
      requestorEmail,
    })

    const response = await fetch("/api/quotations/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quotation,
        requestorEmail,
      }),
    })

    console.log("API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("API error response:", errorData)
      throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log("Email sent successfully:", result)
    return true
  } catch (error) {
    console.error("Error sending quotation email:", error)
    throw error // Re-throw to show specific error message
  }
}

// Update quotation status
export async function updateQuotationStatus(quotationId: string, status: string): Promise<void> {
  try {
    const response = await fetch("/api/quotations/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quotationId,
        status,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update quotation status")
    }
  } catch (error) {
    console.error("Error updating quotation status:", error)
    throw error
  }
}

// Get quotations by campaign ID
export async function getQuotationsByCampaignId(campaignId: string): Promise<Quotation[]> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const quotationsRef = collection(db, "quotations")
    const q = query(quotationsRef, where("campaignId", "==", campaignId))

    const querySnapshot = await getDocs(q)
    const quotations: Quotation[] = []

    querySnapshot.forEach((doc) => {
      quotations.push({ id: doc.id, ...doc.data() } as Quotation)
    })

    return quotations
  } catch (error) {
    console.error("Error fetching quotations by campaign ID:", error)
    return []
  }
}
