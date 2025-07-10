import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { storage, db } from "@/lib/firebase"

interface UploadVideoParams {
  file: File
  productId: string
  spotNumber: number
  companyId: string
  sellerId: string
  onProgress?: (progress: number) => void
}

export const uploadVideoToFirebase = async ({
  file,
  productId,
  spotNumber,
  companyId,
  sellerId,
  onProgress,
}: UploadVideoParams): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a unique filename
    const timestamp = Date.now()
    const fileName = `videos/${productId}/spot_${spotNumber}_${timestamp}_${file.name}`
    const storageRef = ref(storage, fileName)

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Progress callback
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(Math.round(progress))
      },
      (error) => {
        // Error callback
        console.error("Upload error:", error)
        reject(new Error("Failed to upload video"))
      },
      async () => {
        try {
          // Success callback
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

          // Create screen schedule document
          await addDoc(collection(db, "screen_schedule"), {
            active: true,
            product_id: productId,
            spot_number: spotNumber,
            created: serverTimestamp(),
            deleted: false,
            company_id: companyId,
            seller_id: sellerId,
            status: "active",
            media: downloadURL,
            title: file.name,
          })

          resolve(downloadURL)
        } catch (error) {
          console.error("Error creating schedule document:", error)
          reject(new Error("Failed to create schedule"))
        }
      },
    )
  })
}

export const validateVideoFile = (file: File): string | null => {
  const validTypes = ["video/mp4", "video/mov", "video/avi", "video/webm"]
  const maxSize = 100 * 1024 * 1024 // 100MB

  if (!validTypes.includes(file.type)) {
    return "Please select a valid video file (MP4, MOV, AVI, WebM)"
  }

  if (file.size > maxSize) {
    return "File size must be less than 100MB"
  }

  return null
}
