import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { addQuotationToCampaign } from "@/lib/campaign-service"
import { jsPDF } from "jspdf"
import { loadImageAsBase64, getImageDimensions } from "@/lib/pdf-service"
import type { QuotationProduct, Quotation } from "@/lib/types/quotation" // Import the updated Quotation type
import { getProductById as getProductFromFirebase } from "@/lib/firebase-service" // Import the product fetching function

export type { QuotationProduct, Quotation } from "@/lib/types/quotation"

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
  } catch (error: any) {
    console.error("Error creating quotation:", error)
    throw new Error("Failed to create quotation: " + error.message)
  }
}

// Get quotation by ID
export async function getQuotationById(quotationId: string): Promise<Quotation | null> {
  try {
    const quotationDoc = await getDoc(doc(db, "quotations", quotationId))

    if (quotationDoc.exists()) {
      const data = quotationDoc.data() as Quotation
      const itemsFromQuotation = data.items || [] // Changed from products to items

      // Fetch full product details for each product in the quotation
      const enrichedItems: QuotationProduct[] = await Promise.all(
        itemsFromQuotation.map(async (itemInQuotation) => {
          // Changed productInQuotation to itemInQuotation
          if (itemInQuotation.id) {
            const fullProductDetails = await getProductFromFirebase(itemInQuotation.id)
            if (fullProductDetails) {
              // Merge existing quotation product data with full product details.
              // Prioritize quotation-specific fields (like price, notes if they were overridden)
              // but ensure all detailed fields (media, specs_rental, description, etc.) are present.
              return {
                ...fullProductDetails, // Start with all details from the product collection
                ...itemInQuotation, // Overlay with any specific data stored in the quotation's product entry
                // Ensure price from quotation is used if it exists, otherwise fallback to product price
                price: itemInQuotation.price !== undefined ? itemInQuotation.price : fullProductDetails.price,
                // Populate media_url from the first media item if available
                media_url:
                  fullProductDetails.media && fullProductDetails.media.length > 0
                    ? fullProductDetails.media[0].url
                    : undefined,
              } as QuotationProduct
            }
          }
          return itemInQuotation // Return as is if product not found or no ID
        }),
      )

      return {
        id: quotationDoc.id,
        ...data,
        items: enrichedItems, // Changed products to items
      } as Quotation
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
  items: QuotationProduct[], // Changed from products to items
): {
  durationDays: number
  totalAmount: number
} {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  let totalAmount = 0
  items.forEach((item) => {
    // Changed product to item
    const dailyRate = (item.price || 0) / 30 // Assuming price is monthly
    const itemTotal = dailyRate * Math.max(1, durationDays)
    item.item_total_amount = itemTotal // Assign calculated item total amount
    item.duration_days = Math.max(1, durationDays) // Assign calculated duration days to item
    totalAmount += itemTotal
  })

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
  x: number, // Target X for the bounding box
  y: number, // Target Y for the bounding box
  targetWidth: number, // Target width for the bounding box
  targetHeight: number, // Target height for the bounding box
) => {
  try {
    const base64 = await loadImageAsBase64(imageUrl)
    if (!base64) return { actualWidth: 0, actualHeight: 0, xOffset: 0, yOffset: 0 }

    const dimensions = await getImageDimensions(base64)

    const { width: imgWidth, height: imgHeight } = dimensions
    const aspectRatio = imgWidth / imgHeight

    let finalWidth = targetWidth
    let finalHeight = targetHeight

    // Scale to fit within targetWidth and targetHeight while preserving aspect ratio
    if (imgWidth / imgHeight > targetWidth / targetHeight) {
      // Image is wider than target box aspect ratio
      finalHeight = targetWidth / aspectRatio
      finalWidth = targetWidth
    } else {
      // Image is taller than target box aspect ratio
      finalWidth = targetHeight * aspectRatio
      finalHeight = targetHeight
    }

    // Calculate offsets to center the image within the target bounding box
    const xOffset = x + (targetWidth - finalWidth) / 2
    const yOffset = y + (targetHeight - finalHeight) / 2

    pdf.addImage(base64, "JPEG", xOffset, yOffset, finalWidth, finalHeight)
    return { actualWidth: finalWidth, actualHeight: finalHeight, xOffset, yOffset }
  } catch (error) {
    console.error("Error adding image to PDF:", error)
    return { actualWidth: 0, actualHeight: 0, xOffset: 0, yOffset: 0 }
  }
}

// Helper function to calculate text height without drawing
const calculateTextHeight = (text: string, maxWidth: number, fontSize = 10): number => {
  const tempPdf = new jsPDF() // Create a temporary jsPDF instance for calculation
  tempPdf.setFontSize(fontSize)
  const lines = tempPdf.splitTextToSize(text, maxWidth)
  return lines.length * fontSize * 0.35 // Adjusted multiplier for better estimation
}

// Generate separate PDF files for each product in a quotation
export async function generateSeparateQuotationPDFs(
  quotation: Quotation,
  selectedPages?: string[],
  userData?: { first_name?: string; last_name?: string; email?: string },
): Promise<void> {
  try {
    const products = quotation.items || []

    if (products.length <= 1) {
      // If only one product, generate regular PDF
      await generateQuotationPDF(quotation)
      return
    }

    const productsToProcess =
      selectedPages && selectedPages.length > 0
        ? products.filter((product, index) => selectedPages.includes(index.toString()))
        : products

    if (productsToProcess.length === 0) {
      throw new Error("No products selected for PDF generation")
    }

    // Generate separate PDF for each product
    for (let i = 0; i < productsToProcess.length; i++) {
      const product = productsToProcess[i]
      const originalProductIndex = products.indexOf(product)

      // Create a modified quotation for this specific product
      const baseQuotationNumber = quotation.quotation_number || quotation.id
      const uniqueQuotationNumber =
        products.length > 1
          ? `${baseQuotationNumber}-${String.fromCharCode(65 + originalProductIndex)}` // Appends -A, -B, -C, etc.
          : baseQuotationNumber

      const singleProductQuotation = {
        ...quotation,
        items: [product],
        quotation_number: uniqueQuotationNumber,
        total_amount: product.price || 0,
      }

      // Generate PDF for this single product
      await generateQuotationPDF(singleProductQuotation, userData)

      // Add a small delay between downloads to ensure proper file naming
      if (i < productsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
  } catch (error) {
    console.error("Error generating separate quotation PDFs:", error)
    throw error
  }
}

// Generate PDF for quotation
export async function generateQuotationPDF(
  quotation: Quotation,
  userData?: { first_name?: string; last_name?: string; email?: string },
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Safely convert dates
  const createdDate = safeToDate(quotation.created)
  const validUntilDate = safeToDate(quotation.valid_until)

  // Client name and company (top left)
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(0, 0, 0)
  pdf.text(quotation.client_name || "Client Name", margin, yPosition)
  yPosition += 5
  pdf.setFont("helvetica", "normal")
  pdf.text(quotation.client_company_name || "Client Company", margin, yPosition)
  yPosition += 10

  // RFQ Number (top right)
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`RFQ. No. ${quotation.quotation_number}`, pageWidth - margin - 40, yPosition - 15)

  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(
    createdDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    pageWidth - margin - 40,
    yPosition - 10,
  )

  // Greeting message - positioned prominently at top
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "normal")
  const greetingLine1 = "Good Day! Thank you for considering Golden Touch for your business needs."
  const greetingLine2 = "We are pleased to submit our quotation for your requirements:"

  // Calculate center position for each line
  const line1Width = pdf.getTextWidth(greetingLine1)
  const line2Width = pdf.getTextWidth(greetingLine2)
  const centerX = pageWidth / 2

  pdf.text(greetingLine1, centerX - line1Width / 2, yPosition)
  yPosition += 5
  pdf.text(greetingLine2, centerX - line2Width / 2, yPosition)
  yPosition += 15

  // "Details as follows:" section
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.text("Details as follows:", margin, yPosition)
  yPosition += 8

  // Process each product (for single product quotations, this will be one iteration)
  for (const [productIndex, item] of quotation.items.entries()) {
    if (productIndex > 0) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    const bulletPoints = [
      { label: "Site Location", value: item.location || "N/A" },
      { label: "Type", value: "Billboard" },
      { label: "Size", value: item.description || "100ft (H) x 60ft (W)" },
      { label: "Contract Duration", value: `${quotation.duration_days || 30} days` },
      {
        label: "Contract Period",
        value: `${formatDate(quotation.start_date)} - ${formatDate(quotation.end_date)}`,
      },
      { label: "Proposal to", value: quotation.client_company_name || "Client Company" },
      { label: "Illumination", value: "10 units of 1000 watts metal Halide" },
      { label: "Lease Rate/Month", value: "(Exclusive of VAT)" },
      { label: "Total Lease", value: "(Exclusive of VAT)" },
    ]

    bulletPoints.forEach((point) => {
      pdf.text("•", margin, yPosition)
      pdf.setFont("helvetica", "bold")
      pdf.text(`${point.label}:`, margin + 5, yPosition)
      pdf.setFont("helvetica", "normal")

      // Special handling for lease rate values
      if (point.label === "Lease Rate/Month") {
        pdf.text(
          `${(item.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP     ${point.value}`,
          margin + 65,
          yPosition,
        )
      } else if (point.label === "Total Lease") {
        pdf.text(
          `${(item.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP     ${point.value}`,
          margin + 65,
          yPosition,
        )
      } else {
        pdf.text(point.value, margin + 65, yPosition)
      }
      yPosition += 6
    })

    yPosition += 5

    const monthlyRate = item.price || 0
    const durationInMonths = (quotation.duration_days || 30) / 30
    const calculatedTotal = monthlyRate * durationInMonths
    const vatAmount = calculatedTotal * 0.12
    const totalWithVat = calculatedTotal + vatAmount

    pdf.text("Lease rate per month", margin + 5, yPosition)
    pdf.text(
      `${monthlyRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 6

    pdf.text(`x ${Math.ceil(durationInMonths)} months`, margin + 5, yPosition)
    pdf.text(
      `${calculatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 6

    pdf.text("12 % VAT", margin + 5, yPosition)
    pdf.text(
      `${vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 8

    // Total line
    pdf.setFont("helvetica", "bold")
    pdf.text("TOTAL", margin + 5, yPosition)
    pdf.text(
      `${totalWithVat.toLocaleString("en-US", { minimumFractionDigits: 2 })}PHP`,
      pageWidth - margin - 40,
      yPosition,
    )
    yPosition += 10

    // Note about free material changes
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text(`Note: free two (2) change material for ${Math.ceil(durationInMonths)} month rental`, margin, yPosition)
    yPosition += 10

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(11)
    pdf.text("Terms and Conditions:", margin, yPosition)
    yPosition += 8

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    const terms = [
      "1. Quotation validity:  5 working days.",
      "2. Availability of the site is on first-come-first-served-basis only. Only offical documents such as P.O's,",
      "    Media Orders, signed quotation, & contracts are accepted in order to booked the site.",
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

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // "Very truly yours," and "Conforme:" on same line
    pdf.text("Very truly yours,", margin, yPosition)
    pdf.text("C o n f o r m e:", margin + contentWidth / 2, yPosition)
    yPosition += 20

    // Names
    pdf.setFont("helvetica", "normal")
    const userFullName =
      quotation.created_by_first_name && quotation.created_by_last_name
        ? `${quotation.created_by_first_name} ${quotation.created_by_last_name}`
        : "Account Manager"
    pdf.text(userFullName, margin, yPosition)
    pdf.text(quotation.client_name || "Client Name", margin + contentWidth / 2, yPosition)
    yPosition += 6

    // Titles/Companies
    pdf.setFont("helvetica", "normal")
    pdf.text(quotation.position || "Position", margin, yPosition)
    pdf.text(quotation.client_company_name || "Client Company", margin + contentWidth / 2, yPosition)
    yPosition += 10

    // Billing purpose note
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text("This signed Quotation serves as an", margin + contentWidth / 2, yPosition)
    yPosition += 4
    pdf.text("official document for billing purposes", margin + contentWidth / 2, yPosition)
    yPosition += 15

    // Footer with company details
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text(
      "No. 727 General Solano St., San Miguel, Manila 1005. Telephone: (02) 5310 1750 to 53",
      margin,
      pageHeight - 20,
    )
    pdf.text("email: sales@goldentouchimaging.com or gtigolden@gmail.com", margin, pageHeight - 15)
  }

  const baseFileName = (quotation.quotation_number || "quotation").replace(/[^a-z0-9]/gi, "_").toLowerCase()
  const productSuffix =
    quotation.items.length > 1
      ? `_${quotation.items.length}-products`
      : quotation.items.length === 1
        ? `_${quotation.items[0].name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
        : ""
  const fileName = `quotation-${baseFileName}${productSuffix}-${Date.now()}.pdf`

  console.log("[v0] Attempting to download PDF:", fileName)
  pdf.save(fileName)
  console.log("[v0] PDF download triggered successfully")
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
      const data = doc.data()
      quotations.push({ id: doc.id, ...data, items: data.items || [] } as Quotation) // Changed products to items
    })

    return quotations
  } catch (error) {
    console.error("Error fetching quotations by campaign ID:", error)
    return []
  }
}

// Get quotations by created_by ID
export async function getQuotationsByCreatedBy(userId: string): Promise<Quotation[]> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const quotationsRef = collection(db, "quotations")
    const q = query(quotationsRef, where("created_by", "==", userId), orderBy("created", "desc"))

    const querySnapshot = await getDocs(q)
    const quotations: Quotation[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      quotations.push({ id: doc.id, ...data, items: data.items || [] } as Quotation) // Changed products to items
    })

    return quotations
  } catch (error) {
    console.error("Error fetching quotations by created_by ID:", error)
    return []
  }
}

// Get paginated quotations by seller ID
export async function getQuotationsPaginated(
  userId: string,
  pageSize: number,
  startAfterDoc: QueryDocumentSnapshot<DocumentData> | null,
) {
  const quotationsRef = collection(db, "quotations")
  let q

  if (startAfterDoc) {
    q = query(
      quotationsRef,
      where("seller_id", "==", userId),
      orderBy("created", "desc"),
      startAfter(startAfterDoc),
      limit(pageSize),
    )
  } else {
    q = query(quotationsRef, where("seller_id", "==", userId), orderBy("created", "desc"), limit(pageSize))
  }

  const querySnapshot = await getDocs(q)
  const quotations: any[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    quotations.push({ id: doc.id, ...data, items: data.items || [] }) // Changed products to items
  })

  const lastVisibleId = querySnapshot.docs[querySnapshot.docs.length - 1] || null
  const hasMore = querySnapshot.docs.length === pageSize

  return { quotations, lastVisibleId, hasMore }
}

// Copy an existing quotation with a new quotation number
export async function copyQuotation(originalQuotationId: string, userId: string, userName: string): Promise<string> {
  try {
    console.log("Copying quotation:", originalQuotationId)

    // Get the original quotation
    const originalQuotation = await getQuotationById(originalQuotationId)
    if (!originalQuotation) {
      throw new Error("Original quotation not found")
    }

    // Create a copy with new quotation number and reset fields
    const quotationCopy: Omit<Quotation, "id"> = {
      ...originalQuotation,
      quotation_number: generateQuotationNumber(),
      status: "draft", // Reset status to draft
      created_by: userName,
      seller_id: userId,
      // Reset project compliance to initial state
      projectCompliance: {
        signedQuotation: { completed: false, fileUrl: null, fileName: null, uploadedAt: null, notes: null },
        signedContract: { completed: false, fileUrl: null, fileName: null, uploadedAt: null, notes: null },
        poMo: { completed: false, fileUrl: null, fileName: null, uploadedAt: null, notes: null },
        finalArtwork: { completed: false, fileUrl: null, fileName: null, uploadedAt: null, notes: null },
        paymentAsDeposit: { completed: false, fileUrl: null, fileName: null, uploadedAt: null, notes: null },
      },
      // Remove timestamps - they will be set by createQuotation
      created: undefined as any,
      updated: undefined as any,
    }

    // Remove the id field since it's auto-generated
    delete (quotationCopy as any).id

    // Create the new quotation
    const newQuotationId = await createQuotation(quotationCopy)
    console.log("Quotation copied successfully with ID:", newQuotationId)

    return newQuotationId
  } catch (error: any) {
    console.error("Error copying quotation:", error)
    throw new Error("Failed to copy quotation: " + error.message)
  }
}
