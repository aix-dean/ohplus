import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface ReportData {
  id?: string
  reportType: string
  siteId: string
  siteName: string
  siteCode?: string
  companyId?: string
  sellerId?: string
  client?: string
  clientId?: string
  bookingDates: {
    start: string
    end: string
  }
  breakdate?: string
  sales?: string
  date: string
  location?: string
  notes?: string
  attachments?: Array<{
    fileName?: string
    fileUrl?: string
    note?: string
    fileType?: string
    file?: File
  }>
  status?: string
  createdBy: string
  createdByName: string
  created?: Timestamp
  updated?: Timestamp
  assignedTo?: string
  category?: string
  subcategory?: string
  priority?: string
  completionPercentage?: number
  tags?: string[]

  // Installation report specific fields
  installationStatus?: string
  timeline?: string
  delayReason?: string
  delayDays?: number | string
}

// Clean function to remove undefined values recursively
const cleanReportData = (data: any): any => {
  if (data === null || data === undefined) {
    return null
  }

  if (Array.isArray(data)) {
    return data.map(cleanReportData).filter((item) => item !== null && item !== undefined)
  }

  if (typeof data === "object") {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        if (key === "file" && value instanceof File) {
          // Skip File objects as they can't be stored in Firestore
          continue
        }
        cleaned[key] = cleanReportData(value)
      }
    }
    return cleaned
  }

  return data
}

export const createReport = async (reportData: Omit<ReportData, "id" | "created">): Promise<string> => {
  try {
    // Clean the data and provide defaults for required fields
    const cleanedData = cleanReportData({
      ...reportData,
      reportType: reportData.reportType || "",
      siteId: reportData.siteId || "",
      siteName: reportData.siteName || "",
      siteCode: reportData.siteCode || "",
      date: reportData.date || new Date().toISOString().split("T")[0],
      createdBy: reportData.createdBy || "",
      createdByName: reportData.createdByName || "",
      bookingDates: {
        start: reportData.bookingDates?.start || "",
        end: reportData.bookingDates?.end || "",
      },
      location: reportData.location || "",
      notes: reportData.notes || "",
      sales: reportData.sales || "",
      assignedTo: reportData.assignedTo || "",
      status: reportData.status || "draft",
      category: reportData.category || "logistics",
      subcategory: reportData.subcategory || "general",
      priority: reportData.priority || "medium",
      completionPercentage: reportData.completionPercentage || 0,
      tags: reportData.tags || [],
      attachments: (reportData.attachments || []).map((att) => ({
        fileName: att.fileName || "",
        fileUrl: att.fileUrl || "",
        note: att.note || "",
        fileType: att.fileType || "",
      })),
      created: serverTimestamp(),
      updated: serverTimestamp(),
    })

    // Only add installation-specific fields if they have values
    if (reportData.installationStatus && reportData.installationStatus.trim() !== "") {
      cleanedData.installationStatus = reportData.installationStatus
    }
    if (reportData.timeline && reportData.timeline.trim() !== "") {
      cleanedData.timeline = reportData.timeline
    }
    if (reportData.delayReason && reportData.delayReason.trim() !== "") {
      cleanedData.delayReason = reportData.delayReason
    }
    if (
      reportData.delayDays &&
      (typeof reportData.delayDays === "number"
        ? reportData.delayDays > 0
        : reportData.delayDays.toString().trim() !== "")
    ) {
      cleanedData.delayDays =
        typeof reportData.delayDays === "string" ? Number.parseInt(reportData.delayDays) || 0 : reportData.delayDays
    }

    const docRef = await addDoc(collection(db, "reports"), cleanedData)
    return docRef.id
  } catch (error) {
    console.error("Error creating report:", error)
    throw new Error("Failed to create report")
  }
}

export const getReports = async (filters?: {
  companyId?: string
  createdBy?: string
  reportType?: string
  status?: string
}): Promise<ReportData[]> => {
  try {
    let q = query(collection(db, "reports"), orderBy("created", "desc"))

    if (filters?.companyId) {
      q = query(q, where("companyId", "==", filters.companyId))
    }
    if (filters?.createdBy) {
      q = query(q, where("createdBy", "==", filters.createdBy))
    }
    if (filters?.reportType) {
      q = query(q, where("reportType", "==", filters.reportType))
    }
    if (filters?.status) {
      q = query(q, where("status", "==", filters.status))
    }

    const querySnapshot = await getDocs(q)
    const reports: ReportData[] = []

    querySnapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      } as ReportData)
    })

    return reports
  } catch (error) {
    console.error("Error fetching reports:", error)
    throw new Error("Failed to fetch reports")
  }
}

export const getReportById = async (reportId: string): Promise<ReportData | null> => {
  try {
    const docRef = doc(db, "reports", reportId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ReportData
    } else {
      return null
    }
  } catch (error) {
    console.error("Error fetching report:", error)
    throw new Error("Failed to fetch report")
  }
}

export const updateReport = async (reportId: string, updates: Partial<ReportData>): Promise<void> => {
  try {
    const cleanedUpdates = cleanReportData({
      ...updates,
      updated: serverTimestamp(),
    })

    const docRef = doc(db, "reports", reportId)
    await updateDoc(docRef, cleanedUpdates)
  } catch (error) {
    console.error("Error updating report:", error)
    throw new Error("Failed to update report")
  }
}

export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const docRef = doc(db, "reports", reportId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting report:", error)
    throw new Error("Failed to delete report")
  }
}

export const getReportsByDateRange = async (
  startDate: string,
  endDate: string,
  filters?: {
    companyId?: string
    reportType?: string
  },
): Promise<ReportData[]> => {
  try {
    let q = query(
      collection(db, "reports"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc"),
    )

    if (filters?.companyId) {
      q = query(q, where("companyId", "==", filters.companyId))
    }
    if (filters?.reportType) {
      q = query(q, where("reportType", "==", filters.reportType))
    }

    const querySnapshot = await getDocs(q)
    const reports: ReportData[] = []

    querySnapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      } as ReportData)
    })

    return reports
  } catch (error) {
    console.error("Error fetching reports by date range:", error)
    throw new Error("Failed to fetch reports by date range")
  }
}
