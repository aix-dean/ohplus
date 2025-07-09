import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

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

export async function createReport(reportData: ReportData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...reportData,
      created: Timestamp.now(),
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
