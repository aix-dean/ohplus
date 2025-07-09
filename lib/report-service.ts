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
  client: string
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
  }>
  status: "draft" | "submitted" | "approved" | "rejected"
  createdBy: string
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
