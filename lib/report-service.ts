import { db } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

export interface ReportData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  description: string
  images: string[]
  installationStatus?: string
  installationTimeline?: string
  delayReason?: string
  delayDays?: string
}

// Add this helper function at the top of the file
const cleanReportData = (data: any): any => {
  const cleaned: any = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      if (typeof value === "object" && !Array.isArray(value) && !(value instanceof File)) {
        const cleanedNested = cleanReportData(value)
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested
        }
      } else {
        cleaned[key] = value
      }
    }
  }
  return cleaned
}

export const createReport = async (reportData: ReportData): Promise<string> => {
  try {
    // Clean the report data to remove undefined values
    const cleanedData = cleanReportData(reportData)

    const docRef = await addDoc(collection(db, "reports"), {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating report:", error)
    throw error
  }
}
