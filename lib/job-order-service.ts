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
    console.log("DEBUG: getJobOrders called with userId:", userId)
    const jobOrdersRef = collection(db, "job_orders")
    const q = query(jobOrdersRef, where("createdBy", "==", userId), orderBy("createdAt", "desc"))
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
      })
    })

    console.log("DEBUG: getJobOrders returning", jobOrders.length, "job orders")
    return jobOrders
  } catch (error) {
    console.error("Error fetching job orders:", error)
    throw error
  }
}

// Get all job orders for a specific company
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

// Get a single job order by ID
export async function getJobOrderById(jobOrderId: string): Promise<JobOrder | null> {
  try {
    console.log("DEBUG: getJobOrderById called with jobOrderId:", jobOrderId)
    const jobOrderDoc = await getDoc(doc(db, "job_orders", jobOrderId))

    if (jobOrderDoc.exists()) {
      const data = jobOrderDoc.data()
      console.log("DEBUG: Found job order document:", data)
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
        created: data.createdAt,
        updated: data.updatedAt,
        created_by: data.createdBy || "",
        company_id: data.company_id || "",
        quotation_id: data.quotationId || "",
      }
    }

    console.log("DEBUG: Job order document not found")
    return null
  } catch (error) {
    console.error("Error fetching job order:", error)
    return null
  }
}

// Create a new job order
export async function createJobOrder(jobOrderData: Partial<JobOrder>): Promise<string> {
  try {
    console.log("DEBUG: createJobOrder called with data:", jobOrderData)

    const newJobOrder = {
      ...jobOrderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: jobOrderData.status || "pending",
      // Map the fields to match database structure
      createdBy: jobOrderData.created_by,
      quotationId: jobOrderData.quotation_id,
    }

    // Remove the old field names to avoid duplication
    delete newJobOrder.created
    delete newJobOrder.updated
    delete newJobOrder.created_by
    delete newJobOrder.quotation_id

    console.log("DEBUG: Creating job order with data:", newJobOrder)
    const docRef = await addDoc(collection(db, "job_orders"), newJobOrder)
    console.log("DEBUG: Job order created with ID:", docRef.id)

    return docRef.id
  } catch (error) {
    console.error("Error creating job order:", error)
    throw error
  }
}

// Update a job order
export async function updateJobOrder(jobOrderId: string, jobOrderData: Partial<JobOrder>): Promise<void> {
  try {
    console.log("DEBUG: updateJobOrder called with ID:", jobOrderId, "and data:", jobOrderData)

    const jobOrderRef = doc(db, "job_orders", jobOrderId)
    const updateData = {
      ...jobOrderData,
      updatedAt: serverTimestamp(),
    }

    // Map fields to match database structure
    if (jobOrderData.created_by) {
      updateData.createdBy = jobOrderData.created_by
      delete updateData.created_by
    }
    if (jobOrderData.quotation_id) {
      updateData.quotationId = jobOrderData.quotation_id
      delete updateData.quotation_id
    }

    // Remove fields that shouldn't be updated
    delete updateData.created
    delete updateData.updated

    await updateDoc(jobOrderRef, updateData)
    console.log("DEBUG: Job order updated successfully")
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
