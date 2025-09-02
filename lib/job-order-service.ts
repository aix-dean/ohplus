import { db } from "./firebase"
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import type { Quotation } from "./types/quotation"
import type { JobOrder, JobOrderStatus } from "./types/job-order"
import type { Product } from "./firebase-service"
import type { Client } from "./client-service"

const QUOTATIONS_COLLECTION = "quotations"
const JOB_ORDERS_COLLECTION = "job_orders"
const PRODUCTS_COLLECTION = "products"
const CLIENTS_COLLECTION = "client_db"

// New interface for quotation items
export interface QuotationItem {
  price: number
  product_id: string
  product_location: string
  product_name: string
  site_code: string
  type: string
}

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
  products: Product[]
  client: Client | null
  items?: QuotationItem[]
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

    const products: Product[] = []
    let items: QuotationItem[] = []

    // Check if quotation has items array (multiple products)
    if (quotation.items && Array.isArray(quotation.items)) {
      console.log(`[getQuotationDetailsForJobOrder] Found ${quotation.items.length} items in quotation`)
      items = quotation.items as QuotationItem[]

      // Fetch all products for the items
      for (const item of items) {
        if (item.product_id) {
          console.log(`[getQuotationDetailsForJobOrder] Fetching product with ID: ${item.product_id}`)
          const productDocRef = doc(db, PRODUCTS_COLLECTION, item.product_id)
          const productDocSnap = await getDoc(productDocRef)
          if (productDocSnap.exists()) {
            const product = { id: productDocSnap.id, ...productDocSnap.data() } as Product
            products.push(product)
            console.log("[getQuotationDetailsForJobOrder] Fetched product:", product)
          } else {
            console.warn(`[getQuotationDetailsForJobOrder] Product with ID ${item.product_id} not found.`)
          }
        }
      }
    } else if (quotation.product_id) {
      // Single product (legacy format)
      console.log(`[getQuotationDetailsForJobOrder] Fetching single product with ID: ${quotation.product_id}`)
      const productDocRef = doc(db, PRODUCTS_COLLECTION, quotation.product_id)
      const productDocSnap = await getDoc(productDocRef)
      if (productDocSnap.exists()) {
        const product = { id: productDocSnap.id, ...productDocSnap.data() } as Product
        products.push(product)
        console.log("[getQuotationDetailsForJobOrder] Fetched single product:", product)
      } else {
        console.warn(`[getQuotationDetailsForJobOrder] Product with ID ${quotation.product_id} not found.`)
      }
    }

    let client: Client | null = null
    if (quotation.client_id) {
      console.log(`[getQuotationDetailsForJobOrder] Attempting to fetch client by ID: ${quotation.client_id}`)
      const clientDocRef = doc(db, CLIENTS_COLLECTION, quotation.client_id)
      const clientDocSnap = await getDoc(clientDocRef)
      if (clientDocSnap.exists()) {
        client = { id: clientDocSnap.id, ...clientDocSnap.data() } as Client
        console.log("[getQuotationDetailsForJobOrder] Fetched client by ID:", client)
      } else {
        console.warn(`[getQuotationDetailsForJobOrder] Client with ID ${quotation.client_id} not found.`)
      }
    }

    if (products.length === 0) {
      console.warn(`[getQuotationDetailsForJobOrder] No products found for quotation ${quotationId}.`)
      return null
    }

    console.log("[getQuotationDetailsForJobOrder] Successfully fetched all details.")
    return { quotation, products, client, items }
  } catch (error: any) {
    console.error("[getQuotationDetailsForJobOrder] Error fetching quotation details for job order:", error)
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

export async function createMultipleJobOrders(
  jobOrdersData: Array<Omit<JobOrder, "id" | "createdAt" | "updatedAt" | "status" | "createdBy">>,
  createdBy: string,
  status: JobOrderStatus,
): Promise<string[]> {
  console.log("Creating multiple job orders:", jobOrdersData.length)

  try {
    const jobOrderIds: string[] = []

    for (const jobOrderData of jobOrdersData) {
      const docRef = await addDoc(collection(db, JOB_ORDERS_COLLECTION), {
        ...jobOrderData,
        createdBy: createdBy,
        status: status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      jobOrderIds.push(docRef.id)
      console.log("Job Order successfully added with ID:", docRef.id)

      try {
        // Get the current user's UID for comparison
        const currentUserUid = createdBy

        // Only create notification if assignTo is different from current user
        const shouldCreateNotification = jobOrderData.assignTo && jobOrderData.assignTo !== currentUserUid

        if (shouldCreateNotification) {
          const notificationTitle = `New Job Order Assigned: ${jobOrderData.joNumber}`
          const notificationDescription = `A new ${jobOrderData.joType} job order has been created`

          // Create single notification per job order
          await addDoc(collection(db, "notifications"), {
            type: "Job Order",
            title: notificationTitle,
            description: notificationDescription,
            department_to: "Logistics",
            uid_to: jobOrderData.assignTo,
            company_id: jobOrderData.company_id,
            department_from: "Sales",
            viewed: false,
            navigate_to: `${process.env.NEXT_PUBLIC_APP_URL || window?.location?.origin || ""}/logistics/job-orders/${docRef.id}`,
            created: serverTimestamp(),
          })
          console.log(`Single notification created for job order ${docRef.id}`)
        }
      } catch (notificationError) {
        console.error("Error creating notification for job order:", docRef.id, notificationError)
        // Don't throw here - we don't want notification failure to break job order creation
      }
    }

    return jobOrderIds
  } catch (error) {
    console.error("Error adding multiple job orders to Firestore:", error)
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

export async function getJobOrdersByCompanyId(companyId: string): Promise<JobOrder[]> {
  try {
    console.log("DEBUG: getJobOrdersByCompanyId called with companyId:", companyId)

    if (!companyId) {
      console.log("DEBUG: No companyId provided")
      return []
    }

    const jobOrdersRef = collection(db, "job_orders")
    console.log("DEBUG: Created collection reference")

    const q = query(jobOrdersRef, where("company_id", "==", companyId), orderBy("createdAt", "desc"))
    console.log("DEBUG: Created query with company_id filter")

    const querySnapshot = await getDocs(q)
    console.log("DEBUG: Query executed, got", querySnapshot.size, "documents")

    const jobOrders: JobOrder[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log("DEBUG: Processing document", doc.id, "with data:", data)

      jobOrders.push({
        id: doc.id,
        joNumber: data.joNumber || "",
        siteName: data.siteName || "",
        siteLocation: data.siteLocation || "",
        joType: data.joType || "",
        requestedBy: data.requestedBy || "",
        assignTo: data.assignTo || "",
        dateRequested: data.dateRequested,
        deadline: data.deadline,
        jobDescription: data.jobDescription || "",
        message: data.message || "",
        attachments: data.attachments || [],
        status: data.status || "pending",
        created: data.createdAt,
        updated: data.updatedAt,
        created_by: data.createdBy || "",
        company_id: data.company_id || "",
        quotation_id: data.quotationId || "",
      })
    })

    console.log("DEBUG: getJobOrdersByCompanyId returning", jobOrders.length, "job orders")
    console.log("DEBUG: Job orders:", jobOrders)
    return jobOrders
  } catch (error) {
    console.error("Error fetching job orders by company ID:", error)
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
    throw error
  }
}

export async function getJobOrdersByProductId(productId: string): Promise<JobOrder[]> {
  try {
    console.log("Fetching job orders for product ID:", productId)

    if (!productId) {
      console.log("No productId provided")
      return []
    }

    const jobOrdersRef = collection(db, JOB_ORDERS_COLLECTION)
    const q = query(jobOrdersRef, where("product_id", "==", productId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const jobOrders: JobOrder[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      jobOrders.push({
        id: doc.id,
        joNumber: data.joNumber || "",
        siteName: data.siteName || "",
        siteLocation: data.siteLocation || "",
        joType: data.joType || "",
        requestedBy: data.requestedBy || "",
        assignTo: data.assignTo || "",
        dateRequested: data.dateRequested,
        deadline: data.deadline,
        jobDescription: data.jobDescription || "",
        message: data.message || "",
        attachments: data.attachments || [],
        status: data.status || "pending",
        created: data.createdAt,
        updated: data.updatedAt,
        created_by: data.createdBy || "",
        company_id: data.company_id || "",
        quotation_id: data.quotationId || "",
        product_id: data.product_id || "",
      } as JobOrder)
    })

    console.log(`Found ${jobOrders.length} job orders for product ${productId}`)
    return jobOrders
  } catch (error) {
    console.error("Error fetching job orders by product ID:", error)
    throw error
  }
}

export async function getAllJobOrders(): Promise<JobOrder[]> {
  try {
    const q = query(collection(db, JOB_ORDERS_COLLECTION), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    const jobOrders: JobOrder[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as JobOrder[]
    return jobOrders
  } catch (error) {
    console.error("Error fetching all job orders:", error)
    throw error
  }
}

export function generateJONumber(): string {
  const timestamp = Date.now()
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `JO-${timestamp}-${randomSuffix}`
}

export async function generatePersonalizedJONumber(userData: any): Promise<string> {
  try {
    // Extract initials from user's name
    const names = [userData.first_name, userData.middle_name, userData.last_name].filter(Boolean) // Remove empty/null values

    const initials = names
      .map((name) => name.charAt(0).toUpperCase())
      .join("")
      .substring(0, 4) // Limit to 4 characters max

    // If no initials available, use default
    if (!initials) {
      return generateJONumber() // Fallback to original method
    }

    // Count existing job orders for this user to get sequential number
    const jobOrdersRef = collection(db, JOB_ORDERS_COLLECTION)
    const q = query(jobOrdersRef, where("createdBy", "==", userData.uid), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const nextSequence = querySnapshot.size + 1

    // Format as INITIALS-XXXX (e.g., JPDM-0001)
    const sequenceNumber = nextSequence.toString().padStart(4, "0")

    return `${initials}-${sequenceNumber}`
  } catch (error) {
    console.error("Error generating personalized JO number:", error)
    // Fallback to original method if there's an error
    return generateJONumber()
  }
}
