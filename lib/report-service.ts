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
import { db } from "./firebase"

export interface ReportData {
  id?: string
  siteId: string
  siteName: string
  siteCode?: string
  companyId: string
  sellerId: string
  client: string
  clientId: string
  joNumber?: string
  joType?: string
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
    fileName: string
    fileType: string
    fileUrl: string
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
  // Product information
  product?: {
    id: string
    name: string
    content_type?: string
    specs_rental?: any
    light?: any
  }
  // Completion report specific field
  descriptionOfWork?: string
  // Installation report specific fields (optional)
  installationStatus?: string
  installationTimeline?: string
  delayReason?: string
  delayDays?: string
  descriptionOfWork?: string
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
    console.log("Creating report with data:", reportData)
    console.log("Report attachments before processing:", reportData.attachments)

    // Process attachments - ensure they have all required fields
    const processedAttachments = (reportData.attachments || [])
      .filter((attachment: any) => {
        // Only include attachments that have a fileUrl (successfully uploaded)
        return attachment && attachment.fileUrl && attachment.fileName
      })
      .map((attachment: any) => {
        const processedAttachment = {
          note: attachment.note || "",
          fileName: attachment.fileName || "Unknown file",
          fileType: attachment.fileType || "unknown",
          fileUrl: attachment.fileUrl,
        }

        console.log("Processed attachment:", processedAttachment)
        return processedAttachment
      })

    console.log("Processed attachments:", processedAttachments)

    // Create the final report data with proper structure
    const finalReportData: any = {
      siteId: reportData.siteId,
      siteName: reportData.siteName,
      companyId: reportData.companyId,
      sellerId: reportData.sellerId,
      client: reportData.client,
      clientId: reportData.clientId,
      joNumber: reportData.joNumber,
      joType: reportData.joType,
      bookingDates: {
        start: reportData.bookingDates.start,
        end: reportData.bookingDates.end,
      },
      breakdate: reportData.breakdate,
      sales: reportData.sales,
      reportType: reportData.reportType,
      date: reportData.date,
      attachments: processedAttachments,
      status: reportData.status || "draft",
      createdBy: reportData.createdBy,
      createdByName: reportData.createdByName,
      category: reportData.category,
      subcategory: reportData.subcategory,
      priority: reportData.priority,
      completionPercentage: reportData.completionPercentage,
      tags: reportData.tags || [],
      created: Timestamp.now(),
      updated: Timestamp.now(),
    }

    // Add product information if provided
    if (reportData.product) {
      finalReportData.product = reportData.product
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

    // Add description of work for completion reports
    if (reportData.descriptionOfWork && reportData.descriptionOfWork.trim() !== "") {
      finalReportData.descriptionOfWork = reportData.descriptionOfWork.trim()
    }

    console.log("Final report data to be saved:", finalReportData)

    const docRef = await addDoc(collection(db, "reports"), finalReportData)
    console.log("Report created with ID:", docRef.id)

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

    const reports = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log("Retrieved report data:", data)
      console.log("Report attachments:", data.attachments)

      return {
        id: doc.id,
        ...data,
        // Ensure attachments is always an array
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
      }
    }) as ReportData[]

    console.log("Total reports retrieved:", reports.length)
    return reports
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
      attachments: Array.isArray(doc.data().attachments) ? doc.data().attachments : [],
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
      attachments: Array.isArray(doc.data().attachments) ? doc.data().attachments : [],
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
      const data = docSnap.data()
      console.log("Retrieved single report data:", data)
      console.log("Single report attachments:", data.attachments)

      return {
        id: docSnap.id,
        ...data,
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
      } as ReportData
    } else {
      console.log("No report found with ID:", reportId)
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

    // Handle attachments specifically
    if (updateData.attachments) {
      cleanUpdateData.attachments = updateData.attachments
        .filter((attachment: any) => attachment && attachment.fileUrl && attachment.fileName)
        .map((attachment: any) => ({
          note: attachment.note || "",
          fileName: attachment.fileName || "Unknown file",
          fileType: attachment.fileType || "unknown",
          fileUrl: attachment.fileUrl,
        }))
    }

    // Add description of work for completion reports
    if (updateData.descriptionOfWork && updateData.descriptionOfWork.trim() !== "") {
      cleanUpdateData.descriptionOfWork = updateData.descriptionOfWork.trim()
    }

    // Handle product information
    if (updateData.product !== undefined) {
      cleanUpdateData.product = updateData.product
    }

    // Always update the timestamp
    cleanUpdateData.updated = Timestamp.now()

    console.log("Updating report with data:", cleanUpdateData)

    const docRef = doc(db, "reports", reportId)
    await updateDoc(docRef, cleanUpdateData)

    console.log("Report updated successfully")
  } catch (error) {
    console.error("Error updating report:", error)
    throw error
  }
}

export async function deleteReport(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, "reports", reportId)
    await deleteDoc(docRef)
    console.log("Report deleted successfully")
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
      attachments: Array.isArray(doc.data().attachments) ? doc.data().attachments : [],
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
      attachments: Array.isArray(doc.data().attachments) ? doc.data().attachments : [],
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
      attachments: Array.isArray(doc.data().attachments) ? doc.data().attachments : [],
    })) as ReportData[]
  } catch (error) {
    console.error("Error fetching reports by type:", error)
    throw error
  }
}

export async function postReport(reportData: ReportData): Promise<string> {
  try {
    console.log("Posting report with attachments:", reportData.attachments)

    // Set status to "posted" when posting the report
    const postData = {
      ...reportData,
      status: "posted",
      updated: Timestamp.now(),
    }

    const reportId = await createReport(postData)
    console.log("Report posted successfully with ID:", reportId)

    return reportId
  } catch (error) {
    console.error("Error posting report:", error)
    throw error
  }
}
