import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Quotation, QuotationProduct } from "@/lib/types/quotation"
import { generatePdf } from "@/lib/pdf-service" // Assuming this exists for PDF generation

const QUOTATIONS_COLLECTION = "quotations"

// Helper to convert Firestore Timestamp to Date or ISO string
const convertFirestoreTimestampToDate = (timestamp: Timestamp | Date | string | undefined): Date | undefined => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  if (typeof timestamp === "string") {
    const parsedDate = new Date(timestamp)
    return isNaN(parsedDate.getTime()) ? undefined : parsedDate
  }
  return undefined
}

// Helper to format date to YYYY-MM-DD for consistent calculation
const formatDateToYYYYMMDD = (date: Date | string | undefined): string | undefined => {
  const dateObj = convertFirestoreTimestampToDate(date)
  if (!dateObj) return undefined
  return dateObj.toISOString().split("T")[0]
}

export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  try {
    const docRef = doc(db, QUOTATIONS_COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        quotation_number: data.quotation_number,
        client_name: data.client_name,
        client_email: data.client_email,
        start_date: data.start_date?.toDate ? data.start_date.toDate().toISOString() : data.start_date,
        end_date: data.end_date?.toDate ? data.end_date.toDate().toISOString() : data.end_date,
        valid_until: data.valid_until?.toDate ? data.valid_until.toDate().toISOString() : data.valid_until,
        products: data.products || [],
        total_amount: data.total_amount || 0,
        duration_days: data.duration_days || 0,
        status: data.status || "draft",
        notes: data.notes || "",
        created: data.created || null,
        updated: data.updated || null,
        createdBy: data.createdBy || "",
        updatedBy: data.updatedBy || "",
        quotation_request_id: data.quotation_request_id || "",
        proposalId: data.proposalId || "",
        campaignId: data.campaignId || "",
      } as Quotation
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting quotation by ID:", error)
    throw error
  }
}

export const getAllQuotations = async (): Promise<Quotation[]> => {
  try {
    const q = query(collection(db, QUOTATIONS_COLLECTION))
    const querySnapshot = await getDocs(q)
    const quotations: Quotation[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      quotations.push({
        id: doc.id,
        quotation_number: data.quotation_number,
        client_name: data.client_name,
        client_email: data.client_email,
        start_date: data.start_date?.toDate ? data.start_date.toDate().toISOString() : data.start_date,
        end_date: data.end_date?.toDate ? data.end_date.toDate().toISOString() : data.end_date,
        valid_until: data.valid_until?.toDate ? data.valid_until.toDate().toISOString() : data.valid_until,
        products: data.products || [],
        total_amount: data.total_amount || 0,
        duration_days: data.duration_days || 0,
        status: data.status || "draft",
        notes: data.notes || "",
        created: data.created || null,
        updated: data.updated || null,
        createdBy: data.createdBy || "",
        updatedBy: data.updatedBy || "",
        quotation_request_id: data.quotation_request_id || "",
        proposalId: data.proposalId || "",
        campaignId: data.campaignId || "",
      })
    })
    return quotations
  } catch (error) {
    console.error("Error getting all quotations:", error)
    throw error
  }
}

export const createQuotation = async (
  quotationData: Omit<Quotation, "id" | "created" | "updated" | "status">,
  userId: string,
  userName: string,
): Promise<string> => {
  try {
    const newQuotation: Omit<Quotation, "id"> = {
      ...quotationData,
      status: "draft", // Default status
      created: serverTimestamp() as Timestamp,
      updated: serverTimestamp() as Timestamp,
      createdBy: userName,
      updatedBy: userName,
    }
    const docRef = await addDoc(collection(db, QUOTATIONS_COLLECTION), newQuotation)
    return docRef.id
  } catch (error) {
    console.error("Error creating quotation:", error)
    throw error
  }
}

export const updateQuotation = async (
  id: string,
  quotationData: Partial<Quotation>,
  userId: string,
  userName: string,
): Promise<void> => {
  try {
    const docRef = doc(db, QUOTATIONS_COLLECTION, id)
    await updateDoc(docRef, {
      ...quotationData,
      updated: serverTimestamp(),
      updatedBy: userName,
    })
  } catch (error) {
    console.error("Error updating quotation:", error)
    throw error
  }
}

export const updateQuotationStatus = async (id: string, status: Quotation["status"]): Promise<void> => {
  try {
    const docRef = doc(db, QUOTATIONS_COLLECTION, id)
    await updateDoc(docRef, {
      status: status,
      updated: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating quotation status:", error)
    throw error
  }
}

export const deleteQuotation = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, QUOTATIONS_COLLECTION, id), {
      deleted: true,
      updated: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error deleting quotation:", error)
    throw error
  }
}

export const calculateQuotationTotal = (startDateISO: string, endDateISO: string, products: QuotationProduct[]) => {
  const startDate = new Date(startDateISO)
  const endDate = new Date(endDateISO)

  // Calculate duration in days
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end day

  // Calculate total amount based on monthly prices and duration
  let totalAmount = 0
  products.forEach((product) => {
    // Assuming price is per month, calculate daily rate and then total
    const dailyPrice = product.price / 30.44 // Average days in a month
    totalAmount += dailyPrice * durationDays
  })

  return { durationDays, totalAmount }
}

export const generateQuotationPDF = async (quotation: Quotation) => {
  const docDefinition = {
    content: [
      { text: "QUOTATION", style: "header" },
      { text: `Quotation Number: ${quotation.quotation_number}`, style: "subheader" },
      {
        text: `Created Date: ${new Date(quotation.created?.toDate() || Date.now()).toLocaleDateString()}`,
        style: "subheader",
      },
      { text: "\n" },
      { text: "Client Information", style: "sectionHeader" },
      {
        columns: [
          { text: `Client Name: ${quotation.client_name}` },
          { text: `Client Email: ${quotation.client_email}` },
        ],
      },
      { text: "\n" },
      { text: "Quotation Details", style: "sectionHeader" },
      {
        columns: [
          { text: `Start Date: ${new Date(quotation.start_date).toLocaleDateString()}` },
          { text: `End Date: ${new Date(quotation.end_date).toLocaleDateString()}` },
        ],
      },
      { text: `Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}` },
      { text: `Duration: ${quotation.duration_days} days` },
      { text: "\n" },
      { text: "Products & Services", style: "sectionHeader" },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Image", style: "tableHeader" },
              { text: "Product", style: "tableHeader" },
              { text: "Type", style: "tableHeader" },
              { text: "Location", style: "tableHeader" },
              { text: "Price (Monthly)", style: "tableHeader", alignment: "right" },
            ],
            ...quotation.products.map((product) => [
              {
                image: product.imageUrl || "public/placeholder.svg", // Use placeholder if no image
                width: 50,
                height: 50,
                fit: [50, 50],
                alignment: "center",
              },
              {
                stack: [
                  { text: product.name, bold: true },
                  product.site_code ? { text: `Site: ${product.site_code}`, fontSize: 8, color: "#555" } : null,
                  product.description ? { text: product.description, fontSize: 8, color: "#555" } : null,
                ].filter(Boolean),
              },
              product.type,
              product.location,
              { text: `₱${product.price.toLocaleString()}`, alignment: "right" },
            ]),
            [
              { text: "Total Amount:", colSpan: 4, alignment: "right", style: "tableTotal" },
              {},
              {},
              {},
              { text: `₱${quotation.total_amount.toLocaleString()}`, alignment: "right", style: "tableTotal" },
            ],
          ],
        },
        layout: "lightHorizontalLines",
      },
      { text: "\n" },
      { text: "Additional Information", style: "sectionHeader" },
      { text: quotation.notes || "N/A", style: "notes" },
      { text: "\n" },
      {
        text: `This quotation is valid until ${new Date(quotation.valid_until).toLocaleDateString()}`,
        style: "footer",
      },
      { text: `© ${new Date().getFullYear()} OH+ Outdoor Advertising. All rights reserved.`, style: "footer" },
    ],
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        marginBottom: 10,
        alignment: "center",
      },
      subheader: {
        fontSize: 10,
        color: "#555",
        alignment: "center",
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
        color: "#333",
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: "white",
        fillColor: "#4285F4", // Google Blue
        alignment: "center",
      },
      tableTotal: {
        bold: true,
        fontSize: 12,
        color: "#4285F4",
      },
      notes: {
        fontSize: 10,
        color: "#555",
        italics: true,
      },
      footer: {
        fontSize: 8,
        color: "#888",
        alignment: "center",
        marginTop: 10,
      },
    },
    defaultPageMargins: [40, 40, 40, 40],
  }

  await generatePdf(docDefinition, `Quotation-${quotation.quotation_number}.pdf`)
}
