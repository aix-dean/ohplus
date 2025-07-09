"use client"
import { useState, useRef } from "react"
import type React from "react"

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
import { Upload, Video, AlertCircle, CheckCircle } from "lucide-react"
import { uploadVideoToFirebase, createScreenSchedule } from "@/lib/video-upload-service"

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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file")
        return
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSize) {
        setError("File size must be less than 100MB")
        return
      }

      setSelectedFile(file)
      setError(null)
      setShowConfirmation(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !productId || !spotNumber) {
      setError("Missing required information")
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Upload video to Firebase Storage
      const videoUrl = await uploadVideoToFirebase(
        selectedFile,
        `videos/spot_${productId}_${spotNumber}`,
        (progress) => {
          setUploadProgress(progress)
        },
      )

      // Create screen schedule document
      await createScreenSchedule({
        active: true,
        product_id: productId,
        spot_number: spotNumber,
        company_id: companyId || "",
        seller_id: sellerId || "",
        status: "pending",
        media: videoUrl,
      })

      // Success
      setUploading(false)
      setUploadProgress(100)
      onUploadSuccess()
      handleClose()
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "Upload failed")
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setUploading(false)
    setUploadProgress(0)
    setError(null)
    setShowConfirmation(false)
    onOpenChange(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video size={20} />
            Upload Video for Spot {spotNumber}
          </DialogTitle>
          <DialogDescription>
            Upload a video file to schedule for this advertising spot. Only video files are accepted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showConfirmation ? (
            <>
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label htmlFor="video-upload">Select Video File</Label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">MP4, MOV, AVI, WebM (Max 100MB)</p>
                </div>
                <Input
                  ref={fileInputRef}
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-blue-700">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Confirmation Step */}
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Please confirm the upload details before proceeding.</AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Product ID:</span>
                      <p className="font-mono text-xs">{productId}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Spot Number:</span>
                      <p>{spotNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">File Name:</span>
                      <p className="truncate">{selectedFile?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">File Size:</span>
                      <p>{selectedFile ? formatFileSize(selectedFile.size) : "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Success Message */}
                {uploadProgress === 100 && !uploading && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Video uploaded successfully and scheduled for spot {spotNumber}!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!showConfirmation ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setShowConfirmation(true)} disabled={!selectedFile}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={uploading}>
                Back
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                {uploading ? "Uploading..." : "Confirm Upload"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
