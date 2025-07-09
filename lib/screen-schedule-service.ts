import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Initialize Firebase Storage
const storage = getStorage()

// ScreenSchedule interface
export interface ScreenSchedule {
  id?: string
  active: boolean
  product_id: string
  spot_number: number
  created: any
  deleted: boolean
  company_id?: string
  seller_id?: string
  status: string
  media: string
  title?: string
  duration?: number
}

// Get screen schedules by product ID
export async function getScreenSchedulesByProductId(productId: string): Promise<ScreenSchedule[]> {
  try {
    const screenSchedulesRef = collection(db, "screen_schedule")
    const q = query(
      screenSchedulesRef,
      where("product_id", "==", productId),
      where("deleted", "==", false),
      orderBy("spot_number", "asc"),
    )

    const querySnapshot = await getDocs(q)
    const schedules: ScreenSchedule[] = []

    querySnapshot.forEach((doc) => {
      schedules.push({ id: doc.id, ...doc.data() } as ScreenSchedule)
    })

    return schedules
  } catch (error) {
    console.error("Error fetching screen schedules:", error)
    return []
  }
}

// Create a new screen schedule
export async function createScreenSchedule(scheduleData: Partial<ScreenSchedule>): Promise<string> {
  try {
    const newSchedule = {
      ...scheduleData,
      created: serverTimestamp(),
      deleted: false,
      active: scheduleData.active !== undefined ? scheduleData.active : true,
      status: scheduleData.status || "active",
    }

    const docRef = await addDoc(collection(db, "screen_schedule"), newSchedule)
    return docRef.id
  } catch (error) {
    console.error("Error creating screen schedule:", error)
    throw error
  }
}

// Upload video to Firebase Storage
export async function uploadVideoToFirebaseStorage(file: File, productId: string, spotNumber: number): Promise<string> {
  try {
    const timestamp = Date.now()
    const fileName = `${productId}_spot_${spotNumber}_${timestamp}_${file.name}`
    const storageRef = ref(storage, `screen_schedules/${fileName}`)

    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    console.log("Video uploaded successfully:", downloadURL)
    return downloadURL
  } catch (error) {
    console.error("Error uploading video to Firebase Storage:", error)
    throw error
  }
}

// Validate video file
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ["video/mp4", "video/mov", "video/avi", "video/webm", "video/quicktime"]
  const maxSize = 100 * 1024 * 1024 // 100MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Please select a valid video file (MP4, MOV, AVI, WebM)",
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size must be less than 100MB",
    }
  }

  return { isValid: true }
}
