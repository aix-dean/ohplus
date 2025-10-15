"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { ArrowLeft, X } from "lucide-react"

interface SentHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposalId?: string
  reportId?: string
  companyId?: string
  emailType?: "proposal" | "cost_estimate" | "quotation" | "report"
  emailToShow?: EmailRecord
}

interface EmailRecord {
  id: string
  sentAt: Date
  subject: string
  to: string[]
  cc?: string[]
  body: string
  attachments: any[]
}

export function SentHistoryDialog({ open, onOpenChange, proposalId, reportId, companyId, emailType = "proposal", emailToShow }: SentHistoryDialogProps) {
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [fileViewerOpen, setFileViewerOpen] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null)

  useEffect(() => {
    if (open && emailToShow) {
      setSelectedEmail(emailToShow)
    }
  }, [open, emailToShow])


  const handleAttachmentClick = (attachment: any) => {
    setSelectedAttachment(attachment)
    setFileViewerOpen(true)
  }

  const handleCloseFileViewer = () => {
    setFileViewerOpen(false)
    setSelectedAttachment(null)
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[750px] max-w-[95vw] bg-white rounded-md p-0 border-0 shadow-xl">
        <DialogTitle className="sr-only p-0 gap-0 m-0">Email</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Email</span>
          </button>

          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-10 py-6 text-sm text-gray-800">
          {selectedEmail && (
            <>
              <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-2">
                <div className="font-semibold text-gray-800">Date:</div>
                <div>{format(selectedEmail.sentAt, 'MMM d, yyyy')}</div>

                <div className="font-semibold text-gray-800">To:</div>
                <div className="break-words">{selectedEmail.to.join(', ')}</div>

                <div className="font-semibold text-gray-800">Cc:</div>
                <div className="break-words">
                  {selectedEmail.cc?.join(', ') || 'N/A'}
                </div>

                <div className="font-semibold text-gray-800">Subject:</div>
                <div>{selectedEmail.subject}</div>

                <div className="font-semibold text-gray-800">Message:</div>
                <div className="whitespace-pre-line">{selectedEmail.body}</div>
              </div>

              {selectedEmail.attachments?.length > 0 && (
                <div className="grid grid-cols-[100px_1fr] gap-x-2 mt-4">
                  <div className="font-semibold text-gray-800">Attachments:</div>
                  <div className="space-y-1">
                    {selectedEmail.attachments.map((attachment, index) => (
                      <button
                        key={index}
                        onClick={() => handleAttachmentClick(attachment)}
                        className="text-blue-600 hover:text-blue-800 underline text-sm bg-transparent border-none cursor-pointer p-0"
                      >
                        {attachment.fileName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>

      {/* File Viewer Dialog */}
      <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
        <DialogContent className="w-[90vw] h-[90vh] bg-white rounded-md p-0 border-0 shadow-xl">
          <DialogTitle className="sr-only">File Viewer</DialogTitle>
          <div className="relative h-full">
            <button
              onClick={handleCloseFileViewer}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close file viewer"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <div className="p-6 h-full">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                {selectedAttachment?.fileName || 'File Viewer'}
              </h2>
              <iframe
                src={selectedAttachment?.fileUrl}
                className="w-full h-[calc(100%-2rem)] border rounded-md"
                title={selectedAttachment?.fileName || 'File Viewer'}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}