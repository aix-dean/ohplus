import { db } from "./firebase"
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import type { Quotation } from "./types/quotation"
import type { JobOrder, JobOrderStatus } from "./types/job-order"
import type { Product } from "./firebase-service"
import type { Client } from "./client-service"

const QUOTATIONS_COLLECTION = "quotations"
const JOB_ORDERS_COLLECTION = "job_orders"
const PRODUCTS_COLLECTION = "products"
const CLIENTS_COLLECTION = "client_db" // Corrected: Changed from "clients" to "client_db"

export async function getQuotationsForSelection(userId: string): Promise<Quotation[]> {
  try {
    const q = query(
      collection(db, QUOTATIONS_COLLECTION),
      where("created_by", "==", userId),
      orderBy("created", "desc"),
    )
    const querySnapshot = await getDocs(q)
    const quotations: Quotation[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Quotation[]
    return quotations
  } catch (error) {
    console.error("Error fetching quotations for selection:", error)
    throw error
  }
}

export async function getQuotationById(quotationId: string): Promise<Quotation | null> {
  try {
    const docRef = doc(db, QUOTATIONS_COLLECTION, quotationId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Quotation
    } else {
      return null
    }
  } catch (error) {
    console.error("Error fetching quotation by ID:", error)
    throw error
  }
}

export async function getQuotationDetailsForJobOrder(quotationId: string): Promise<{
  quotation: Quotation
  product: Product
  client: Client | null // Client can be null if not found
} | null> {
  console.log(`[getQuotationDetailsForJobOrder] Attempting to fetch details for quotationId: ${quotationId}`)
  try {
    const quotationDocRef = doc(db, QUOTATIONS_COLLECTION, quotationId)
    const quotationDocSnap = await getDoc(quotationDocRef)

    if (!quotationDocSnap.exists()) {
      console.warn(`[getQuotationDetailsForJobOrder] Quotation with ID ${quotationId} not found.`)
      return null
    }
    const quotation = { id: quotationDocSnap.id, ...quotationDocSnap.data() } as Quotation
    console.log("[getQuotationDetailsForJobOrder] Fetched quotation:", quotation)

    let product: Product | null = null
    if (quotation.product_id) {
      console.log(`[getQuotationDetailsForJobOrder] Fetching product with ID: ${quotation.product_id}`)
      const productDocRef = doc(db, PRODUCTS_COLLECTION, quotation.product_id)
      const productDocSnap = await getDoc(productDocRef)
      if (productDocSnap.exists()) {
        product = { id: productDocSnap.id, ...productDocSnap.data() } as Product
        console.log("[getQuotationDetailsForJobOrder] Fetched product:", product)
      } else {
        console.warn(
          `[getQuotationDetailsForJobOrder] Product with ID ${quotation.product_id} not found for quotation ${quotationId}.`,
        )
      }
    } else {
      console.warn(`[getQuotationDetailsForJobOrder] No product_id found in quotation ${quotationId}.`)
    }

    let client: Client | null = null
    if (quotation.client_id) {
      console.log(
        `[getQuotationDetailsForJobOrder] Attempting to fetch client by ID: ${quotation.client_id} from ${CLIENTS_COLLECTION} for quotation ${quotationId}`,
      )
      const clientDocRef = doc(db, CLIENTS_COLLECTION, quotation.client_id)
      const clientDocSnap = await getDoc(clientDocRef)
      if (clientDocSnap.exists()) {
        client = { id: clientDocSnap.id, ...clientDocSnap.data() } as Client
        console.log("[getQuotationDetailsForJobOrder] Fetched client by ID:", client)
      } else {
        console.warn(
          `[getQuotationDetailsForJobOrder] Client with ID ${quotation.client_id} not found in ${CLIENTS_COLLECTION} for quotation ${quotationId}. Client will be null.`,
        )
      }
    } else {
      console.warn(
        `[getQuotationDetailsForJobOrder] No client_id found in quotation ${quotationId}. Client will be null.`,
      )
    }

    if (!product) {
      console.warn(
        `[getQuotationDetailsForJobOrder] Missing product (${!product}) details for quotation ${quotationId}. Returning null.`,
      )
      return null
    }

    console.log("[getQuotationDetailsForJobOrder] Successfully fetched all details (client might be null).")
    return { quotation, product, client }
  } catch (error: any) {
    console.error("[getQuotationDetailsForJobOrder] Error fetching quotation details for job order:", error)
    if (error.code) {
      console.error(`Firestore Error Code: ${error.code}`)
    }
    if (error.message) {
      console.error(`Firestore Error Message: ${error.message}`)
    }
    throw new Error("Failed to fetch quotation details due to an unexpected error.")
  }
}

export async function createJobOrder(
  jobOrderData: Omit<JobOrder, "id" | "createdAt" | "updatedAt" | "status" | "createdBy">,
  createdBy: string,
  status: JobOrderStatus,
): Promise<string> {
  console.log("Received job order data in createJobOrder (service):", jobOrderData)
  console.log("Created By (service):", createdBy)
  console.log("Status (service):", status)

  try {
    const docRef = await addDoc(collection(db, JOB_ORDERS_COLLECTION), {
      ...jobOrderData,
      createdBy: createdBy,
      status: status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log("Job Order successfully added with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error adding job order to Firestore:", error)
    throw error
  }
}

export async function createJobOrderFromQuotationDetails(
  quotation: Quotation,
  product: Product,
  client: Client | null,
  createdBy: string,
  status: JobOrderStatus,
): Promise<string> {
  console.log("[createJobOrderFromQuotationDetails] Creating job order with provided details.")
  try {
    const jobOrderData: Omit<JobOrder, "id" | "createdAt" | "updatedAt" | "status" | "createdBy"> = {
      quotationId: quotation.id,
      quotationNumber: quotation.quotation_number,
      productId: product.id,
      productName: product.name,
      productLocation: product.specs_rental?.location || product.light?.location || "N/A",
      clientId: client?.id || null,
      clientName: client?.name || "N/A",
      clientCompany: client?.company || "N/A",
      clientEmail: client?.email || "N/A",
      startDate: quotation.start_date,
      endDate: quotation.end_date,
      totalAmount: quotation.total_amount,
    }

    const docRef = await addDoc(collection(db, JOB_ORDERS_COLLECTION), {
      ...jobOrderData,
      createdBy: createdBy,
      status: status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log("Job Order successfully added with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error adding job order from details to Firestore:", error)
    throw error
  }
}

export async function getJobOrders(userId: string): Promise<JobOrder[]> {
  try {
    const q = query(
      collection(db, JOB_ORDERS_COLLECTION),
      where("createdBy", "==", userId),
      orderBy("createdAt", "desc"),
    )
    const querySnapshot = await getDocs(q)
    const jobOrders: JobOrder[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as JobOrder[]
    return jobOrders
  } catch (error) {
    console.error("Error fetching job orders:", error)
    throw error
  }
}
