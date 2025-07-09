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
  reportType: "completion-report" | "maintenance-report" | "inspection-report" | "incident-report"
  date: string
  attachments: Array<{
    note: string
    fileName?: string
    fileUrl?: string
    fileType?: string
    fileSize?: number
  }>
  status: "draft" | "submitted" | "approved" | "rejected"
  createdBy: string
  assignedTo?: string
  priority?: "low" | "medium" | "high" | "urgent"
  description?: string
  findings?: string
  recommendations?: string
  nextActionRequired?: boolean
  nextActionDate?: string
  nextActionDescription?: string
  approvedBy?: string
  approvedDate?: Timestamp
  rejectedBy?: string
  rejectedDate?: Timestamp
  rejectionReason?: string
  submittedDate?: Timestamp
  completionPercentage?: number
  workOrderNumber?: string
  estimatedCost?: number
  actualCost?: number
  laborHours?: number
  materialsUsed?: Array<{
    item: string
    quantity: number
    unit: string
    cost?: number
  }>
  weatherConditions?: string
  safetyIncidents?: Array<{
    type: string
    description: string
    severity: "minor" | "major" | "critical"
    actionTaken: string
  }>
  qualityCheckPassed?: boolean
  qualityCheckNotes?: string
  clientFeedback?: string
  clientSignature?: string
  technicianSignature?: string
  supervisorSignature?: string
  gpsLocation?: {
    latitude: number
    longitude: number
  }
  tags?: string[]
  isArchived?: boolean
  version?: number
  parentReportId?: string
  relatedReports?: string[]
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
      version: 1,
      isArchived: false,
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

export async function getReportsByStatus(status: ReportData["status"]): Promise<ReportData[]> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), where("status", "==", status), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReportData[]
  } catch (error) {
    console.error("Error fetching reports by status:", error)
    throw error
  }
}

export async function getReportsByDateRange(startDate: string, endDate: string): Promise<ReportData[]> {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReportData[]
  } catch (error) {
    console.error("Error fetching reports by date range:", error)
    throw error
  }
}

export async function archiveReport(reportId: string): Promise<void> {
  try {
    await updateReport(reportId, { isArchived: true })
  } catch (error) {
    console.error("Error archiving report:", error)
    throw error
  }
}

export async function approveReport(reportId: string, approvedBy: string): Promise<void> {
  try {
    await updateReport(reportId, {
      status: "approved",
      approvedBy,
      approvedDate: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error approving report:", error)
    throw error
  }
}

export async function rejectReport(reportId: string, rejectedBy: string, rejectionReason: string): Promise<void> {
  try {
    await updateReport(reportId, {
      status: "rejected",
      rejectedBy,
      rejectedDate: Timestamp.now(),
      rejectionReason,
    })
  } catch (error) {
    console.error("Error rejecting report:", error)
    throw error
  }
}

export async function submitReport(reportId: string): Promise<void> {
  try {
    await updateReport(reportId, {
      status: "submitted",
      submittedDate: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error submitting report:", error)
    throw error
  }
}
