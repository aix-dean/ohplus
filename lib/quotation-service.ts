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

export { generateQuotationPDF } from "@/lib/quotation-pdf-service" // Export the new generateQuotationPDF function
