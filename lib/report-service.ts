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
  limit,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"

export interface ReportData {
  id?: string
  siteId: string
  siteName: string
  siteCode?: string
  companyId: string
  sellerId: string
  client: string
  clientId: string
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
    fileType?: string
    fileUrl?: string
  }>
  status: string
  createdBy: string
  createdByName: string
  created?: Timestamp
  updated?: Timestamp
  location?: string
  category: string
  subcategory: string
  priority: string
  completionPercentage: number
  tags: string[]
  assignedTo?: string
  // Installation report specific fields (optional)
  installationStatus?: string
  installationTimeline?: string
  delayReason?: string
  delayDays?: string
}

// Helper function to clean data by removing undefined values
function cleanReportData(data: any): any {
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
        cleaned[key] = cleanReportData(value)
      }
    }
    return cleaned
  }

  return data
}

export async function createReport(reportData: ReportData): Promise<string> {
  try {
    // Clean the data to remove undefined values
    const cleanedData = cleanReportData(reportData)

    // Upload attachments first
    const processedAttachments = await Promise.all(
      (cleanedData.attachments || []).map(async (attachment: any) => {
        if (attachment.file) {
          try {
            const fileRef = ref(storage, `reports/${Date.now()}_${attachment.fileName}`)
            const snapshot = await uploadBytes(fileRef, attachment.file)
            const downloadURL = await getDownloadURL(snapshot.ref)

            return {
              note: attachment.note || "",
              fileName: attachment.fileName,
              fileType: attachment.fileType,
              fileUrl: downloadURL,
            }
          } catch (error) {
            console.error("Error uploading attachment:", error)
            return {
              note: attachment.note || "",
              fileName: attachment.fileName || "Unknown file",
              fileType: attachment.fileType,
              fileUrl: null,
            }
          }
        }
        return attachment
      }),
    )

    const finalReportData = {
      ...cleanedData,
      attachments: processedAttachments,
      created: Timestamp.now(),
      updated: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, "reports"), finalReportData)
    return docRef.id
  } catch (error) {
    console.error("Error creating report:", error)
    throw error
  }
}

export async function getReports(): Promise<ReportData[]> {
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

export async function getReportsByCompany(companyId: string): Promise<ReportData[]> {
  try {
    const q = query(collection(db, "reports"), where("companyId", "==", companyId), orderBy("created", "desc"))
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
    const q = query(collection(db, "reports"), where("sellerId", "==", sellerId), orderBy("created", "desc"))
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

export async function getReportById(reportId: string): Promise<ReportData | null> {
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
    console.error("Error fetching report by ID:", error)
    throw error
  }
}

export async function updateReport(reportId: string, updateData: Partial<ReportData>): Promise<void> {
  try {
    // Clean the data to remove undefined values
    const cleanedData = cleanReportData(updateData)

    const docRef = doc(db, "reports", reportId)
    await updateDoc(docRef, {
      ...cleanedData,
      updated: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating report:", error)
    throw error
  }
}

export async function deleteReport(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, "reports", reportId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting report:", error)
    throw error
  }
}

export async function getRecentReports(limitCount = 10): Promise<ReportData[]> {
  try {
    const q = query(collection(db, "reports"), orderBy("created", "desc"), limit(limitCount))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReportData[]
  } catch (error) {
    console.error("Error fetching recent reports:", error)
    throw error
  }
}

export async function getReportsByStatus(status: string): Promise<ReportData[]> {
  try {
    const q = query(collection(db, "reports"), where("status", "==", status), orderBy("created", "desc"))
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

export async function getReportsByType(reportType: string): Promise<ReportData[]> {
  try {
    const q = query(collection(db, "reports"), where("reportType", "==", reportType), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReportData[]
  } catch (error) {
    console.error("Error fetching reports by type:", error)
    throw error
  }
}
