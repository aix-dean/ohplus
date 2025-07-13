import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore"
import { db } from "./firebase"

export interface ReportData {
  id?: string
  reportType: string
  siteId: string
  siteName: string
  assignedTo: string
  date: string
  location?: string
  notes?: string
  attachments?: Array<{
    fileName?: string
    fileUrl?: string
    note?: string
  }>
  created?: any
  createdBy?: string
  createdByName?: string
  sales?: string
  bookingDates: {
    start: string
    end: string
  }
  completionPercentage?: number
  siteCode?: string
  // Installation-specific fields
  installationStatus?: string
  timeline?: string
  delayReason?: string
  delayDays?: number
}

// Helper function to clean data before sending to Firestore
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
        if (typeof value === "string" && value.trim() === "") {
          cleaned[key] = ""
        } else {
          const cleanedValue = cleanReportData(value)
          if (cleanedValue !== null && cleanedValue !== undefined) {
            cleaned[key] = cleanedValue
          }
        }
      }
    }
    return cleaned
  }

  return data
}

export const createReport = async (reportData: Omit<ReportData, "id" | "created">): Promise<string> => {
  try {
    // Ensure all required fields have default values
    const dataToSave = {
      reportType: reportData.reportType || "",
      siteId: reportData.siteId || "",
      siteName: reportData.siteName || "",
      assignedTo: reportData.assignedTo || "",
      date: reportData.date || new Date().toISOString().split("T")[0],
      location: reportData.location || "",
      notes: reportData.notes || "",
      attachments: reportData.attachments || [],
      createdBy: reportData.createdBy || "",
      createdByName: reportData.createdByName || "",
      sales: reportData.sales || "",
      bookingDates: {
        start: reportData.bookingDates?.start || "",
        end: reportData.bookingDates?.end || "",
      },
      completionPercentage: reportData.completionPercentage || 100,
      siteCode: reportData.siteCode || "",
      created: serverTimestamp(),
    }

    // Only add installation-specific fields if they have values
    if (reportData.installationStatus && reportData.installationStatus.trim() !== "") {
      dataToSave.installationStatus = reportData.installationStatus
    }
    if (reportData.timeline && reportData.timeline.trim() !== "") {
      dataToSave.timeline = reportData.timeline
    }
    if (reportData.delayReason && reportData.delayReason.trim() !== "") {
      dataToSave.delayReason = reportData.delayReason
    }
    if (reportData.delayDays !== undefined && reportData.delayDays !== null && reportData.delayDays > 0) {
      dataToSave.delayDays = reportData.delayDays
    }

    // Clean the data to remove any undefined values
    const cleanedData = cleanReportData(dataToSave)

    const docRef = await addDoc(collection(db, "reports"), cleanedData)
    return docRef.id
  } catch (error) {
    console.error("Error creating report:", error)
    throw error
  }
}

export const getReports = async (): Promise<ReportData[]> => {
  try {
    const q = query(collection(db, "reports"), orderBy("created", "desc"))
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

export const updateReport = async (id: string, updates: Partial<ReportData>): Promise<void> => {
  try {
    const cleanedUpdates = cleanReportData(updates)
    await updateDoc(doc(db, "reports", id), cleanedUpdates)
  } catch (error) {
    console.error("Error updating report:", error)
    throw error
  }
}

export const deleteReport = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "reports", id))
  } catch (error) {
    console.error("Error deleting report:", error)
    throw error
  }
}

export const getReportById = async (id: string): Promise<ReportData | null> => {
  try {
    const docRef = doc(db, "reports", id)
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
    throw error
  }
}
