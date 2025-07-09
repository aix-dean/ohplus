import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Initialize Firebase Storage
const storage = getStorage()

// Interface for screen schedule document
interface ScreenScheduleData {
  active: boolean
  product_id: string
  spot_number: number
  company_id: string
  seller_id: string
  status: string
  media: string
}

/**
 * Upload video file to Firebase Storage
 * @param file The video file to upload
 * @param path The storage path for the file
 * @param onProgress Callback function to track upload progress
 * @returns Promise that resolves to the download URL
 */
export async function uploadVideoToFirebase(
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a unique filename with timestamp
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `${path}/${fileName}`)

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file)

    // Monitor upload progress
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Calculate progress percentage
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) {
          onProgress(Math.round(progress))
        }
      },
      (error) => {
        // Handle upload errors
        console.error("Upload error:", error)
        reject(new Error(`Upload failed: ${error.message}`))
      },
      async () => {
        // Upload completed successfully
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        } catch (error) {
          reject(new Error("Failed to get download URL"))
        }
      },
    )
  })
}

/**
 * Create a new screen schedule document in Firestore
 * @param data The screen schedule data
 * @returns Promise that resolves to the document ID
 */
export async function createScreenSchedule(data: ScreenScheduleData): Promise<string> {
  try {
    // Prepare document data
    const scheduleData = {
      active: data.active,
      product_id: data.product_id,
      spot_number: data.spot_number,
      created: serverTimestamp(),
      deleted: false,
      company_id: data.company_id,
      seller_id: data.seller_id,
      status: data.status,
      media: data.media,
    }

    // Add document to screen_schedule collection
    const docRef = await addDoc(collection(db, "screen_schedule"), scheduleData)

    console.log("Screen schedule created with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creating screen schedule:", error)
    throw new Error("Failed to create screen schedule")
  }
}

/**
 * Validate video file
 * @param file The file to validate
 * @returns Object with validation result and error message if any
 */
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith("video/")) {
    return { isValid: false, error: "Please select a valid video file" }
  }

  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 100MB" }
  }

  // Check supported formats
  const supportedFormats = ["video/mp4", "video/mov", "video/avi", "video/webm", "video/quicktime"]
  if (!supportedFormats.includes(file.type)) {
    return { isValid: false, error: "Unsupported video format. Please use MP4, MOV, AVI, or WebM" }
  }

  return { isValid: true }
}
