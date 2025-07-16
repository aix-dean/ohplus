import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Quotation } from "@/lib/quotation-service"

export interface JobOrder {
  id?: string
  job_order_number: string
  quotation_id: string
  quotation_number: string
  client_name: string
  client_email: string
  client_company?: string
  product_name: string
  product_location: string
  site_code?: string
  start_date: string
  end_date: string
  duration_days: number
  total_amount: number
  status: "pending" | "in_progress" | "completed" | "cancelled"
  created_by: string
  created_by_name?: string
  assigned_to?: string
  assigned_to_name?: string
  notes?: string
  created: any
  updated?: any
  company_id?: string
}

// Generate job order number
export function generateJobOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const time = String(now.getTime()).slice(-4)

  return `JO-${year}${month}${day}-${time}`
}

// Create a new job order from quotation
export async function createJobOrderFromQuotation(
  quotation: Quotation,
  createdBy: string,
  createdByName: string,
  companyId?: string,
  notes?: string,
): Promise<string> {
  try {
    const jobOrderData: Omit<JobOrder, "id"> = {
      job_order_number: generateJobOrderNumber(),
      quotation_id: quotation.id!,
      quotation_number: quotation.quotation_number,
      client_name: quotation.client_name || "",
      client_email: quotation.client_email || "",
      client_company: quotation.client_company || "",
      product_name: quotation.product_name,
      product_location: quotation.product_location || "",
      site_code: quotation.site_code,
      start_date: quotation.start_date,
      end_date: quotation.end_date,
      duration_days: quotation.duration_days,
      total_amount: quotation.total_amount,
      status: "pending",
      created_by: createdBy,
      created_by_name: createdByName,
      notes,
      created: serverTimestamp(),
      company_id: companyId,
    }

    const docRef = await addDoc(collection(db, "job_orders"), jobOrderData)
    console.log("Job order created with ID:", docRef.id)

    return docRef.id
  } catch (error) {
    console.error("Error creating job order:", error)
    throw new Error("Failed to create job order: " + error.message)
  }
}

// Get job order by ID
export async function getJobOrderById(jobOrderId: string): Promise<JobOrder | null> {
  try {
    const jobOrderDoc = await getDoc(doc(db, "job_orders", jobOrderId))

    if (jobOrderDoc.exists()) {
      return { id: jobOrderDoc.id, ...jobOrderDoc.data() } as JobOrder
    }

    return null
  } catch (error) {
    console.error("Error fetching job order:", error)
    return null
  }
}

// Get job orders by created_by
export async function getJobOrdersByCreatedBy(userId: string): Promise<JobOrder[]> {
  try {
    const jobOrdersRef = collection(db, "job_orders")
    const q = query(jobOrdersRef, where("created_by", "==", userId), orderBy("created", "desc"))

    const querySnapshot = await getDocs(q)
    const jobOrders: JobOrder[] = []

    querySnapshot.forEach((doc) => {
      jobOrders.push({ id: doc.id, ...doc.data() } as JobOrder)
    })

    return jobOrders
  } catch (error) {
    console.error("Error fetching job orders by created_by:", error)
    return []
  }
}

// Get job orders by company
export async function getJobOrdersByCompany(companyId: string): Promise<JobOrder[]> {
  try {
    const jobOrdersRef = collection(db, "job_orders")
    const q = query(jobOrdersRef, where("company_id", "==", companyId), orderBy("created", "desc"))

    const querySnapshot = await getDocs(q)
    const jobOrders: JobOrder[] = []

    querySnapshot.forEach((doc) => {
      jobOrders.push({ id: doc.id, ...doc.data() } as JobOrder)
    })

    return jobOrders
  } catch (error) {
    console.error("Error fetching job orders by company:", error)
    return []
  }
}

// Update job order status
export async function updateJobOrderStatus(
  jobOrderId: string,
  status: JobOrder["status"],
  updatedBy: string,
): Promise<void> {
  try {
    const jobOrderRef = doc(db, "job_orders", jobOrderId)
    await updateDoc(jobOrderRef, {
      status,
      updated: serverTimestamp(),
      updated_by: updatedBy,
    })
  } catch (error) {
    console.error("Error updating job order status:", error)
    throw new Error("Failed to update job order status: " + error.message)
  }
}

// Assign job order to user
export async function assignJobOrder(
  jobOrderId: string,
  assignedTo: string,
  assignedToName: string,
  assignedBy: string,
): Promise<void> {
  try {
    const jobOrderRef = doc(db, "job_orders", jobOrderId)
    await updateDoc(jobOrderRef, {
      assigned_to: assignedTo,
      assigned_to_name: assignedToName,
      status: "in_progress",
      updated: serverTimestamp(),
      updated_by: assignedBy,
    })
  } catch (error) {
    console.error("Error assigning job order:", error)
    throw new Error("Failed to assign job order: " + error.message)
  }
}

// Get quotations for selection (for job order creation)
export async function getQuotationsForSelection(userId: string): Promise<Quotation[]> {
  try {
    const quotationsRef = collection(db, "quotations")
    const q = query(
      quotationsRef,
      where("created_by", "==", userId),
      orderBy("created", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const quotations: Quotation[] = []

    querySnapshot.forEach((doc) => {
      quotations.push({ id: doc.id, ...doc.data() } as Quotation)
    })

    return quotations
  } catch (error) {
    console.error("Error fetching quotations for selection:", error)
    return []
  }
}

// Get paginated job orders
export async function getPaginatedJobOrders(
  userId: string,
  pageSize: number,
  startAfterDoc: QueryDocumentSnapshot<DocumentData> | null,
  companyId?: string,
) {
  try {
    const jobOrdersRef = collection(db, "job_orders")
    let q

    const constraints = []

    if (companyId) {
      constraints.push(where("company_id", "==", companyId))
    } else {
      constraints.push(where("created_by", "==", userId))
    }

    constraints.push(orderBy("created", "desc"))
    constraints.push(limit(pageSize))

    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc))
    }

    q = query(jobOrdersRef, ...constraints)

    const querySnapshot = await getDocs(q)
    const jobOrders: JobOrder[] = []

    querySnapshot.forEach((doc) => {
      jobOrders.push({ id: doc.id, ...doc.data() } as JobOrder)
    })

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null
    const hasMore = querySnapshot.docs.length === pageSize

    return { jobOrders, lastVisibleDoc, hasMore }
  } catch (error) {
    console.error("Error fetching paginated job orders:", error)
    return { jobOrders: [], lastVisibleDoc: null, hasMore: false }
  }
}
