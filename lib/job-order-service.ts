import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { JobOrder } from "@/lib/types/job-order"

const COLLECTION_NAME = "job_orders"

// Helper function to convert Firestore document to JobOrder
function convertFirestoreDoc(doc: QueryDocumentSnapshot | DocumentSnapshot): JobOrder | null {
  if (!doc.exists()) return null

  const data = doc.data()

  return {
    id: doc.id,
    joNumber: data.joNumber || "",
    siteName: data.siteName || "",
    siteLocation: data.siteLocation || data.siteCode || "",
    joType: data.joType || "Other",
    requestedBy: data.requestedBy || "",
    assignTo: data.assignTo || "",
    dateRequested: data.dateRequested || "",
    deadline: data.deadline || "",
    jobDescription: data.jobDescription || data.remarks || "",
    message: data.message || "",
    attachments: data.attachments || [],
    status: data.status || "pending",
    created: data.createdAt || data.created || new Date(),
    updated: data.updatedAt || data.updated || new Date(),
    created_by: data.createdBy || data.created_by || "",
    company_id: data.company_id || "",
    quotation_id: data.quotationId || data.quotation_id || "",

    // Additional fields
    clientCompany: data.clientCompany,
    clientName: data.clientName,
    contractDuration: data.contractDuration,
    contractPeriodEnd: data.contractPeriodEnd,
    contractPeriodStart: data.contractPeriodStart,
    leaseRatePerMonth: data.leaseRatePerMonth,
    missingCompliance: data.missingCompliance,
    poMo: data.poMo,
    projectFa: data.projectFa,
    signedQuotation: data.signedQuotation,
    poMoUrl: data.poMoUrl,
    product_id: data.product_id,
    projectFaUrl: data.projectFaUrl,
    quotationNumber: data.quotationNumber,
    remarks: data.remarks,
    signedQuotationUrl: data.signedQuotationUrl,
    siteCode: data.siteCode,
    siteIllumination: data.siteIllumination,
    siteImageUrl: data.siteImageUrl,
    siteSize: data.siteSize,
    siteType: data.siteType,
    totalAmount: data.totalAmount,
    totalLease: data.totalLease,
    totalMonths: data.totalMonths,
    vatAmount: data.vatAmount,
  }
}

export async function getJobOrdersByCompanyId(
  companyId: string,
  pageSize = 20,
  lastDoc?: DocumentSnapshot,
): Promise<{ jobOrders: JobOrder[]; lastDoc?: DocumentSnapshot; hasMore: boolean }> {
  try {
    console.log("DEBUG: Fetching job orders for company:", companyId)

    let q = query(
      collection(db, COLLECTION_NAME),
      where("company_id", "==", companyId),
      orderBy("createdAt", "desc"),
      limit(pageSize),
    )

    if (lastDoc) {
      q = query(
        collection(db, COLLECTION_NAME),
        where("company_id", "==", companyId),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize),
      )
    }

    const querySnapshot = await getDocs(q)
    console.log("DEBUG: Query snapshot size:", querySnapshot.size)

    const jobOrders: JobOrder[] = []

    querySnapshot.forEach((doc) => {
      console.log("DEBUG: Processing document:", doc.id, doc.data())
      const jobOrder = convertFirestoreDoc(doc)
      if (jobOrder) {
        jobOrders.push(jobOrder)
      }
    })

    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
    const hasMore = querySnapshot.docs.length === pageSize

    console.log("DEBUG: Converted job orders:", jobOrders.length)
    return { jobOrders, lastDoc: newLastDoc, hasMore }
  } catch (error) {
    console.error("Error fetching job orders:", error)
    throw error
  }
}

export async function getJobOrderById(id: string): Promise<JobOrder | null> {
  try {
    console.log("DEBUG: Fetching job order by ID:", id)
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      console.log("DEBUG: Job order found:", docSnap.data())
      return convertFirestoreDoc(docSnap)
    } else {
      console.log("DEBUG: Job order not found")
      return null
    }
  } catch (error) {
    console.error("Error fetching job order:", error)
    throw error
  }
}

export async function createJobOrder(jobOrder: Omit<JobOrder, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...jobOrder,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating job order:", error)
    throw error
  }
}

export async function updateJobOrder(id: string, updates: Partial<JobOrder>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating job order:", error)
    throw error
  }
}

export async function deleteJobOrder(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting job order:", error)
    throw error
  }
}
