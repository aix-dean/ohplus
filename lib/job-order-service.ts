import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { JobOrder } from "@/lib/types/job-order"

// Get all job orders for a specific user
export async function getJobOrders(userId: string): Promise<JobOrder[]> {
  try {
    const jobOrdersRef = collection(db, "job_orders")
    const q = query(jobOrdersRef, where("created_by", "==", userId), orderBy("created", "desc"))
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
        created: data.created,
        updated: data.updated,
        created_by: data.created_by || "",
        company_id: data.company_id || "",
        quotation_id: data.quotation_id || "",
      })
    })

    return jobOrders
  } catch (error) {
    console.error("Error fetching job orders:", error)
    throw error
  }
}

// Get all job orders for a specific company
export async function getJobOrdersByCompanyId(companyId: string): Promise<JobOrder[]> {
  try {
    const jobOrdersRef = collection(db, "job_orders")
    const q = query(jobOrdersRef, where("company_id", "==", companyId), orderBy("created", "desc"))
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
        created: data.created,
        updated: data.updated,
        created_by: data.created_by || "",
        company_id: data.company_id || "",
        quotation_id: data.quotation_id || "",
      })
    })

    return jobOrders
  } catch (error) {
    console.error("Error fetching job orders by company ID:", error)
    throw error
  }
}

// Get a single job order by ID
export async function getJobOrderById(jobOrderId: string): Promise<JobOrder | null> {
  try {
    const jobOrderDoc = await getDoc(doc(db, "job_orders", jobOrderId))

    if (jobOrderDoc.exists()) {
      const data = jobOrderDoc.data()
      return {
        id: jobOrderDoc.id,
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
        created: data.created,
        updated: data.updated,
        created_by: data.created_by || "",
        company_id: data.company_id || "",
        quotation_id: data.quotation_id || "",
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching job order:", error)
    return null
  }
}

// Create a new job order
export async function createJobOrder(jobOrderData: Partial<JobOrder>): Promise<string> {
  try {
    const newJobOrder = {
      ...jobOrderData,
      created: serverTimestamp(),
      updated: serverTimestamp(),
      status: jobOrderData.status || "pending",
    }

    const docRef = await addDoc(collection(db, "job_orders"), newJobOrder)
    return docRef.id
  } catch (error) {
    console.error("Error creating job order:", error)
    throw error
  }
}

// Update a job order
export async function updateJobOrder(jobOrderId: string, jobOrderData: Partial<JobOrder>): Promise<void> {
  try {
    const jobOrderRef = doc(db, "job_orders", jobOrderId)
    const updateData = {
      ...jobOrderData,
      updated: serverTimestamp(),
    }

    await updateDoc(jobOrderRef, updateData)
  } catch (error) {
    console.error("Error updating job order:", error)
    throw error
  }
}

// Generate a unique JO number
export function generateJONumber(): string {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `JO-${timestamp.slice(-6)}${random}`
}

// Get quotations available for job order creation
export async function getQuotationsForSelection(userId: string): Promise<any[]> {
  try {
    const quotationsRef = collection(db, "quotations")
    const q = query(
      quotationsRef,
      where("created_by", "==", userId),
      orderBy("created", "desc"),
    )
    const querySnapshot = await getDocs(q)

    const quotations: any[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      quotations.push({
        id: doc.id,
        quotation_number: data.quotation_number || "",
        client_name: data.client_name || "",
        product_name: data.product_name || "",
        items: data.items || null,
        status: data.status || "",
        created: data.created,
        created_by: data.created_by || "",
        created_by_first_name: data.created_by_first_name || "",
        created_by_last_name: data.created_by_last_name || "",
        company_id: data.company_id || "",
      })
    })

    return quotations
  } catch (error) {
    console.error("Error fetching quotations for selection:", error)
    throw error
  }
}
