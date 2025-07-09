"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Video, CheckCircle, AlertCircle } from "lucide-react"
import { uploadVideoToFirebaseStorage, createScreenSchedule, validateVideoFile } from "@/lib/screen-schedule-service"

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

    const validation = validateVideoFile(file)
    if (!validation.isValid) {
      setError(validation.error || "Invalid file")
      return
    }

    setSelectedFile(file)
    setError(null)
    setStep("confirm")
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile || !productId || !spotNumber) {
      setError("Missing required information")
      return
    }

    setStep("uploading")
    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload video to Firebase Storage
      const mediaUrl = await uploadVideoToFirebaseStorage(selectedFile, productId, spotNumber)

      // Create screen schedule document
      await createScreenSchedule({
        active: true,
        product_id: productId,
        spot_number: spotNumber,
        company_id: companyId,
        seller_id: sellerId,
        status: "active",
        media: mediaUrl,
        title: selectedFile.name,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setStep("success")
      setSuccess(true)

      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose()
        onUploadSuccess()
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      setError("Failed to upload video. Please try again.")
      setStep("confirm")
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setError(null)
    setSuccess(false)
    setUploadProgress(0)
    setStep("select")
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video size={20} />
            Upload Video for Spot {spotNumber}
          </DialogTitle>
          <DialogDescription>Upload a video file to schedule for this advertising spot.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "select" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="video-upload">Select Video File</Label>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/mov,video/avi,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Supported formats: MP4, MOV, AVI, WebM (Max: 100MB)</p>
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
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Ready to upload video for Spot {spotNumber}</AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Video size={16} />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">Size: {formatFileSize(selectedFile.size)}</div>
                <div className="text-sm text-muted-foreground">Type: {selectedFile.type}</div>
              </div>
            </div>
          )}

          {step === "uploading" && (
            <div className="space-y-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 animate-pulse" />
                <p className="mt-2 font-medium">Uploading video...</p>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <p className="font-medium text-green-700">Upload Successful!</p>
                <p className="text-sm text-muted-foreground">Video has been scheduled for Spot {spotNumber}</p>
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
              <Button onClick={handleConfirmUpload} disabled={uploading}>
                Confirm Upload
              </Button>
            </>
          )}

          {step === "uploading" && (
            <Button variant="outline" disabled>
              Uploading...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
