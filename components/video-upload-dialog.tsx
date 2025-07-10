"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Video, CheckCircle, AlertCircle } from "lucide-react"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { storage, db } from "@/lib/firebase"

interface VideoUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess: () => void
  productId?: string
  spotNumber?: number | null
  companyId?: string
  sellerId?: string
}

export default function VideoUploadDialog({
  open,
  onOpenChange,
  onUploadSuccess,
  productId,
  spotNumber,
  companyId,
  sellerId,
}: VideoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<"select" | "confirm" | "uploading" | "success">("select")

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["video/mp4", "video/mov", "video/avi", "video/webm"]
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid video file (MP4, MOV, AVI, WebM)")
      return
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB in bytes
    if (file.size > maxSize) {
      setError("File size must be less than 100MB")
      return
    }

    setSelectedFile(file)
    setError(null)
    setStep("confirm")
  }

  const handleUpload = async () => {
    if (!selectedFile || !productId || !spotNumber) return

    setUploading(true)
    setStep("uploading")
    setError(null)

    try {
      // Create a unique filename
      const timestamp = Date.now()
      const fileName = `videos/${productId}/spot_${spotNumber}_${timestamp}_${selectedFile.name}`
      const storageRef = ref(storage, fileName)

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, selectedFile)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error) => {
          console.error("Upload error:", error)
          setError("Failed to upload video. Please try again.")
          setUploading(false)
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

            // Create screen schedule document
            await addDoc(collection(db, "screen_schedule"), {
              active: true,
              product_id: productId,
              spot_number: spotNumber,
              created: serverTimestamp(),
              deleted: false,
              company_id: companyId || "",
              seller_id: sellerId || "",
              id: `${productId}_spot_${spotNumber}_${timestamp}`,
              status: "active",
              media: downloadURL,
              title: selectedFile.name,
            })

            setSuccess(true)
            setStep("success")
            setUploading(false)

            // Call success callback after a short delay
            setTimeout(() => {
              onUploadSuccess()
              handleClose()
            }, 2000)
          } catch (error) {
            console.error("Error creating schedule document:", error)
            setError("Failed to save video schedule. Please try again.")
            setUploading(false)
          }
        },
      )
    } catch (error) {
      console.error("Upload error:", error)
      setError("Failed to upload video. Please try again.")
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null)
      setError(null)
      setSuccess(false)
      setUploadProgress(0)
      setStep("select")
      onOpenChange(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video size={20} />
            Upload Video for Spot {spotNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === "select" && (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="video-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">Click to upload a video</span>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </Label>
                <p className="text-xs text-gray-500 mt-2">MP4, MOV, AVI, WebM up to 100MB</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {step === "confirm" && selectedFile && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Selected Video</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>File:</span>
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spot:</span>
                    <span className="font-medium">Spot {spotNumber}</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This video will be scheduled for Spot {spotNumber}. Are you sure you want to continue?
                </AlertDescription>
              </Alert>
            </>
          )}

          {step === "uploading" && (
            <>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading video...</p>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-center text-gray-500">{Math.round(uploadProgress)}% complete</p>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <h4 className="font-medium text-green-900">Upload Successful!</h4>
                <p className="text-sm text-green-700">Video has been scheduled for Spot {spotNumber}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "select" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700">
                Upload Video
              </Button>
            </>
          )}

          {step === "uploading" && (
            <Button disabled className="bg-blue-600">
              Uploading...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
