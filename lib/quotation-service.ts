import { collection, addDoc, serverTimestamp, getDoc, doc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import jsPDF from "jspdf"
import { addQuotationToCampaign } from "@/lib/campaign-service"

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
  status: "draft" | "sent" | "accepted" | "rejected" | "expired"
  created: any
  updated?: any
  created_by?: string
  client_name?: string
  client_email?: string
  campaignId?: string // Add campaign ID field
  proposalId?: string // Add proposal ID field
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

// Generate PDF for quotation
export function generateQuotationPDF(quotation: Quotation): void {
  const doc = new jsPDF()

  // Set font
  doc.setFont("helvetica")

  // Header
  doc.setFontSize(20)
  doc.setTextColor(37, 99, 235) // Blue color
  doc.text("OH Plus", 105, 20, { align: "center" })

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text("QUOTATION", 105, 30, { align: "center" })

  doc.setFontSize(12)
  doc.text(`Quotation No: ${quotation.quotation_number}`, 105, 40, { align: "center" })

  // Line separator
  doc.setLineWidth(0.5)
  doc.line(20, 45, 190, 45)

  let yPosition = 60

  // Client Information
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Client Information", 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Client Name: ${quotation.client_name || "N/A"}`, 20, yPosition)
  doc.text(`Email: ${quotation.client_email || "N/A"}`, 110, yPosition)
  yPosition += 20

  // Product Details
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Product Details", 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Product Name: ${quotation.product_name}`, 20, yPosition)
  yPosition += 6
  doc.text(`Location: ${quotation.product_location || "N/A"}`, 20, yPosition)
  yPosition += 6
  doc.text(`Site Code: ${quotation.site_code || "N/A"}`, 20, yPosition)
  yPosition += 20

  // Rental Period
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Rental Period", 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const startDate = new Date(quotation.start_date).toLocaleDateString()
  const endDate = new Date(quotation.end_date).toLocaleDateString()

  doc.text(`Start Date: ${startDate}`, 20, yPosition)
  doc.text(`End Date: ${endDate}`, 110, yPosition)
  yPosition += 6
  doc.text(`Duration: ${quotation.duration_days} days`, 20, yPosition)
  doc.text(`Price per Day: ₱${quotation.price.toLocaleString()}`, 110, yPosition)
  yPosition += 20

  // Notes (if any)
  if (quotation.notes) {
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Notes", 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const splitNotes = doc.splitTextToSize(quotation.notes, 170)
    doc.text(splitNotes, 20, yPosition)
    yPosition += splitNotes.length * 6 + 10
  }

  // Total Amount Box
  doc.setFillColor(243, 244, 246) // Light gray background
  doc.rect(20, yPosition, 170, 20, "F")
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(5, 150, 105) // Green color
  doc.text(`Total Amount: ₱${quotation.total_amount.toLocaleString()}`, 105, yPosition + 12, { align: "center" })

  // Footer
  yPosition += 40
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128) // Gray color
  doc.setFont("helvetica", "normal")
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, yPosition, { align: "center" })
  doc.text("This quotation is valid for 30 days from the date of issue.", 105, yPosition + 5, { align: "center" })

  // Download the PDF
  doc.save(`Quotation-${quotation.quotation_number}.pdf`)
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
