import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"
import { getProductById } from "./firebase-service"

export interface ReportData {
  id?: string
  siteId: string
  siteName: string
  siteCode?: string
  companyId: string
  sellerId: string
  client: string
  clientId?: string
  bookingDates: {
    start: string
    end: string
  }
  breakdate: string
  sales: string
  reportType: string
  date: string
  attachments: Array<{
    note: string
    file?: File
    fileName?: string
    fileUrl?: string
    fileType?: string
  }>
  status: "draft" | "submitted" | "approved" | "rejected"
  createdBy: string
  createdByName?: string
  assignedTo?: string
  assignedToName?: string
  priority?: "low" | "medium" | "high"
  description?: string
  location?: string
  weatherConditions?: string
  equipmentUsed?: string[]
  issuesEncountered?: string
  recommendations?: string
  completionPercentage?: number
  nextScheduledDate?: string
  cost?: number
  currency?: string
  approvedBy?: string
  approvedByName?: string
  approvedDate?: Timestamp
  rejectedReason?: string
  submittedDate?: Timestamp
  tags?: string[]
  category?: string
  subcategory?: string
  created?: Timestamp
  updated?: Timestamp
}

const REPORTS_COLLECTION = "reports"

export async function uploadReportAttachment(file: File, reportId: string, index: number): Promise<string> {
  try {
    const fileExtension = file.name.split(".").pop()
    const fileName = `reports/${reportId}/attachment_${index}.${fileExtension}`
    const storageRef = ref(storage, fileName)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  } catch (error) {
    console.error("Error uploading attachment:", error)
    throw error
  }
}

export async function createReport(reportData: ReportData): Promise<string> {
  try {
    // First create the report to get an ID
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...reportData,
      attachments: [], // Temporarily empty while we upload files
      created: Timestamp.now(),
      updated: Timestamp.now(),
    })

    // Upload attachments and get URLs
    const uploadedAttachments = await Promise.all(
      reportData.attachments.map(async (attachment, index) => {
        if (attachment.file) {
          try {
            const fileUrl = await uploadReportAttachment(attachment.file, docRef.id, index)
            return {
              note: attachment.note,
              fileName: attachment.fileName,
              fileUrl: fileUrl,
              fileType: attachment.fileType,
            }
          } catch (error) {
            console.error(`Error uploading attachment ${index}:`, error)
            return {
              note: attachment.note,
              fileName: attachment.fileName,
              fileType: attachment.fileType,
            }
          }
        }
        return {
          note: attachment.note,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
        }
      }),
    )

    // Update the report with the uploaded attachment URLs
    await updateDoc(doc(db, REPORTS_COLLECTION, docRef.id), {
      attachments: uploadedAttachments,
      updated: Timestamp.now(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating report:", error)
    throw error
  }
}

export async function getReports(siteId?: string): Promise<ReportData[]> {
  try {
    let q = query(collection(db, REPORTS_COLLECTION), orderBy("created", "desc"))

    if (siteId) {
      q = query(collection(db, REPORTS_COLLECTION), where("siteId", "==", siteId), orderBy("created", "desc"))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReportData[]
  } catch (error) {
    console.error("Error fetching reports:", error)
    throw error
  }
}

export async function getReportById(reportId: string): Promise<{ report: ReportData; product: any }> {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, reportId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error("Report not found")
    }

    const reportData = {
      id: docSnap.id,
      ...docSnap.data(),
    } as ReportData

    // Fetch product data if siteId exists
    let productData = null
    if (reportData.siteId) {
      try {
        productData = await getProductById(reportData.siteId)
      } catch (error) {
        console.error("Error fetching product data:", error)
        // Continue without product data
      }
    }

    return {
      report: reportData,
      product: productData,
    }
  } catch (error) {
    console.error("Error fetching report by ID:", error)
    throw error
  }
}

export async function getReportsByCompany(companyId: string): Promise<ReportData[]> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), where("companyId", "==", companyId), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReportData[]
  } catch (error) {
    console.error("Error fetching reports by company:", error)
    throw error
  }
}

export async function getReportsBySeller(sellerId: string): Promise<ReportData[]> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), where("sellerId", "==", sellerId), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReportData[]
  } catch (error) {
    console.error("Error fetching reports by seller:", error)
    throw error
  }
}

export async function updateReport(reportId: string, updates: Partial<ReportData>): Promise<void> {
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId)
    await updateDoc(reportRef, {
      ...updates,
      updated: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating report:", error)
    throw error
  }
}

export async function deleteReport(reportId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REPORTS_COLLECTION, reportId))
  } catch (error) {
    console.error("Error deleting report:", error)
    throw error
  }
}
