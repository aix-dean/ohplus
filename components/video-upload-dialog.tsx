"use client"
import { useState } from "react"
import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle, AlertCircle, Video } from "lucide-react"
import { uploadVideoToFirebase } from "@/lib/video-upload-service"

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
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["video/mp4", "video/mov", "video/avi", "video/webm"]
      if (!validTypes.includes(file.type)) {
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
      setShowConfirmation(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !productId || !spotNumber || !companyId || !sellerId) {
      setError("Missing required information")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      await uploadVideoToFirebase({
        file: selectedFile,
        productId,
        spotNumber,
        companyId,
        sellerId,
        onProgress: (progress) => {
          setUploadProgress(progress)
        },
      })

      setSuccess(true)
      setTimeout(() => {
        onUploadSuccess()
        handleClose()
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setUploading(false)
    setUploadProgress(0)
    setError(null)
    setSuccess(false)
    setShowConfirmation(false)
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video size={20} />
            Upload Video for Spot {spotNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showConfirmation ? (
            // File Selection Step
            <div className="space-y-4">
              <div>
                <Label htmlFor="video-upload">Select Video File</Label>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/mov,video/avi,video/webm"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: MP4, MOV, AVI, WebM (Max: 100MB)</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            // Confirmation Step
            <div className="space-y-4">
              {!uploading && !success && (
                <div className="space-y-3">
                  <h3 className="font-medium">Confirm Upload</h3>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">File:</span>
                      <span className="font-medium">{selectedFile?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Size:</span>
                      <span>{selectedFile ? formatFileSize(selectedFile.size) : ""}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Spot:</span>
                      <span className="font-medium">Spot {spotNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">Uploading video...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500 text-center">{uploadProgress}% complete</p>
                </div>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Video uploaded successfully! Spot {spotNumber} has been scheduled.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!showConfirmation ? (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <div className="flex gap-2">
              {!uploading && !success && (
                <>
                  <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                    Back
                  </Button>
                  <Button onClick={handleUpload} disabled={!selectedFile}>
                    Confirm Upload
                  </Button>
                </>
              )}
              {(success || error) && <Button onClick={handleClose}>Close</Button>}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
