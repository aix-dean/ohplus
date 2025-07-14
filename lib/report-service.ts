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

// Helper function to clean data by removing undefined values recursively
function cleanReportData(data: any): any {
  if (data === null || data === undefined) {
    return null
  }

  if (Array.isArray(data)) {
    return data.map(cleanReportData).filter((item) => item !== null && item !== undefined)
  }

  if (typeof data === "object" && !(data instanceof File) && !(data instanceof Timestamp)) {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const cleanedValue = cleanReportData(value)
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue
        }
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null
  }

  return data
}

export async function createReport(reportData: ReportData): Promise<string> {
  try {
    console.log("Starting report creation with data:", reportData)

    // Upload attachments first
    const processedAttachments = await Promise.all(
      (reportData.attachments || []).map(async (attachment: any, index: number) => {
        console.log(`Processing attachment ${index + 1}:`, {
          hasFile: !!attachment.file,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          fileSize: attachment.file?.size,
          note: attachment.note,
        })

        if (attachment.file && attachment.file instanceof File) {
          try {
            // Create a unique filename with timestamp
            const timestamp = Date.now()
            const sanitizedFileName = attachment.fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") || `file_${index}`
            const storageFileName = `${timestamp}_${sanitizedFileName}`

            console.log(`Uploading file to Firebase Storage: reports/${storageFileName}`)

            const fileRef = ref(storage, `reports/${storageFileName}`)
            const snapshot = await uploadBytes(fileRef, attachment.file)
            const downloadURL = await getDownloadURL(snapshot.ref)

            console.log(`File uploaded successfully. Download URL: ${downloadURL}`)

            return {
              note: attachment.note || "",
              fileName: attachment.fileName || sanitizedFileName,
              fileType: attachment.fileType || attachment.file.type,
              fileUrl: downloadURL,
            }
          } catch (error) {
            console.error(`Error uploading attachment ${index + 1}:`, error)

            // Return attachment info without URL if upload fails
            return {
              note: attachment.note || "",
              fileName: attachment.fileName || "Unknown file",
              fileType: attachment.fileType || "",
              fileUrl: null,
              uploadError: error instanceof Error ? error.message : "Upload failed",
            }
          }
        } else if (attachment.fileUrl) {
          // If attachment already has a URL (e.g., from preview), keep it
          console.log(`Attachment ${index + 1} already has URL:`, attachment.fileUrl)
          return {
            note: attachment.note || "",
            fileName: attachment.fileName || "",
            fileType: attachment.fileType || "",
            fileUrl: attachment.fileUrl,
          }
        } else {
          // Return basic attachment info for attachments without files
          console.log(`Attachment ${index + 1} has no file or URL`)
          return {
            note: attachment.note || "",
            fileName: attachment.fileName || "",
            fileType: attachment.fileType || "",
            fileUrl: null,
          }
        }
      }),
    )

    console.log("Processed attachments:", processedAttachments)

    // Create the final report data with proper structure
    const finalReportData: any = {
      siteId: reportData.siteId,
      siteName: reportData.siteName,
      companyId: reportData.companyId,
      sellerId: reportData.sellerId,
      client: reportData.client,
      clientId: reportData.clientId,
      bookingDates: reportData.bookingDates,
      breakdate: reportData.breakdate,
      sales: reportData.sales,
      reportType: reportData.reportType,
      date: reportData.date,
      attachments: processedAttachments,
      status: reportData.status,
      createdBy: reportData.createdBy,
      createdByName: reportData.createdByName,
      category: reportData.category,
      subcategory: reportData.subcategory,
      priority: reportData.priority,
      completionPercentage: reportData.completionPercentage,
      tags: reportData.tags,
      created: Timestamp.now(),
      updated: Timestamp.now(),
    }

    // Add optional fields only if they have values
    if (reportData.siteCode) {
      finalReportData.siteCode = reportData.siteCode
    }

    if (reportData.location) {
      finalReportData.location = reportData.location
    }

    if (reportData.assignedTo) {
      finalReportData.assignedTo = reportData.assignedTo
    }

    // Add installation-specific fields only if they have values
    if (reportData.installationStatus && reportData.installationStatus.trim() !== "") {
      finalReportData.installationStatus = reportData.installationStatus
    }

    if (reportData.installationTimeline && reportData.installationTimeline.trim() !== "") {
      finalReportData.installationTimeline = reportData.installationTimeline
    }

    if (reportData.delayReason && reportData.delayReason.trim() !== "") {
      finalReportData.delayReason = reportData.delayReason
    }

    if (reportData.delayDays && reportData.delayDays.trim() !== "") {
      finalReportData.delayDays = reportData.delayDays
    }

    console.log("Final report data to be saved:", finalReportData)

    const docRef = await addDoc(collection(db, "reports"), finalReportData)

    console.log("Report created successfully with ID:", docRef.id)

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
    // Create a clean update object with only defined values
    const cleanUpdateData: any = {}

    // Copy only defined values, excluding undefined and null
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanUpdateData[key] = value
      }
    })

    // Always update the timestamp
    cleanUpdateData.updated = Timestamp.now()

    const docRef = doc(db, "reports", reportId)
    await updateDoc(docRef, cleanUpdateData)
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
