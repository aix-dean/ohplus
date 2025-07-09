import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  attachments: {
    note: string
    file?: File
    fileUrl?: string
  }[]
  status: "draft" | "pending" | "completed" | "approved"
  createdBy: string
  created?: Timestamp
  updated?: Timestamp
}

// Create a new report
export async function createReport(reportData: Omit<ReportData, "id">): Promise<string> {
  try {
    const newReport = {
      ...reportData,
      created: serverTimestamp(),
      updated: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "reports"), newReport)
    return docRef.id
  } catch (error) {
    console.error("Error creating report:", error)
    throw error
  }
}

// Get reports by site ID
export async function getReportsBySiteId(siteId: string): Promise<ReportData[]> {
  try {
    const reportsRef = collection(db, "reports")
    const q = query(reportsRef, where("siteId", "==", siteId), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    const reports: ReportData[] = []
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as ReportData)
    })

    return reports
  } catch (error) {
    console.error("Error fetching reports by site ID:", error)
    return []
  }
}

// Get all reports
export async function getAllReports(): Promise<ReportData[]> {
  try {
    const reportsRef = collection(db, "reports")
    const q = query(reportsRef, orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    const reports: ReportData[] = []
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as ReportData)
    })

    return reports
  } catch (error) {
    console.error("Error fetching all reports:", error)
    return []
  }
}

// Get reports by user
export async function getReportsByUser(userId: string): Promise<ReportData[]> {
  try {
    const reportsRef = collection(db, "reports")
    const q = query(reportsRef, where("createdBy", "==", userId), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    const reports: ReportData[] = []
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as ReportData)
    })

    return reports
  } catch (error) {
    console.error("Error fetching reports by user:", error)
    return []
  }
}

// Update report status
export async function updateReportStatus(reportId: string, status: ReportData["status"]): Promise<void> {
  try {
    const reportRef = doc(db, "reports", reportId)
    await updateDoc(reportRef, {
      status,
      updated: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating report status:", error)
    throw error
  }
}

// Get a single report by ID
export async function getReportById(reportId: string): Promise<ReportData | null> {
  try {
    const reportDoc = await getDoc(doc(db, "reports", reportId))

    if (reportDoc.exists()) {
      return { id: reportDoc.id, ...reportDoc.data() } as ReportData
    }

    return null
  } catch (error) {
    console.error("Error fetching report:", error)
    return null
  }
}

// Update report
export async function updateReport(reportId: string, reportData: Partial<ReportData>): Promise<void> {
  try {
    const reportRef = doc(db, "reports", reportId)

    const updateData = {
      ...reportData,
      updated: serverTimestamp(),
    }

    await updateDoc(reportRef, updateData)
  } catch (error) {
    console.error("Error updating report:", error)
    throw error
  }
}

// Get reports by status
export async function getReportsByStatus(status: ReportData["status"]): Promise<ReportData[]> {
  try {
    const reportsRef = collection(db, "reports")
    const q = query(reportsRef, where("status", "==", status), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    const reports: ReportData[] = []
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as ReportData)
    })

    return reports
  } catch (error) {
    console.error("Error fetching reports by status:", error)
    return []
  }
}
