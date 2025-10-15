"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { getSentEmailsForProposal } from "@/lib/proposal-service"
import { getSentEmailsForReport, getSentEmailsForCompany } from "@/lib/report-service"
import { format } from "date-fns"
import { X } from "lucide-react"

interface SentHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    proposalId?: string
    reportId?: string
    companyId?: string
    emailType?: "proposal" | "cost_estimate" | "quotation" | "report"
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

export function SentHistoryDialog({ open, onOpenChange, proposalId, reportId, companyId, emailType = "proposal" }: SentHistoryDialogProps) {
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [fileViewerOpen, setFileViewerOpen] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null)

  useEffect(() => {
    if (open && (proposalId || reportId || companyId)) {
      fetchEmails()
      setCurrentView('list')
      setSelectedEmail(null)
    }
  }, [open, proposalId, reportId, companyId])

  const handleEmailClick = (email: EmailRecord) => {
    setSelectedEmail(email)
    setCurrentView('detail')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedEmail(null)
  }

  const handleAttachmentClick = (attachment: any) => {
    setSelectedAttachment(attachment)
    setFileViewerOpen(true)
  }

  const handleCloseFileViewer = () => {
    setFileViewerOpen(false)
    setSelectedAttachment(null)
  }

  const fetchEmails = async () => {
    setLoading(true)
    try {
      let emailData
      if (companyId && emailType === "report") {
        emailData = await getSentEmailsForCompany(companyId)
      } else if (emailType === "report") {
        emailData = await getSentEmailsForReport(reportId!)
      } else {
        emailData = await getSentEmailsForProposal(proposalId!, emailType)
      }
      setEmails(emailData as EmailRecord[])
    } catch (error) {
      console.error("Error fetching emails:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1012px] h-[544px] max-w-[95vw] max-h-[90vh] bg-white rounded-[20px] p-0 border-0 shadow-lg">
        <DialogTitle className="sr-only">Sent History</DialogTitle>
        <div className="relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        <div className="p-6">
          {currentView === 'list' ? (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Sent History</h2>

              {/* Headers */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-base text-gray-800 w-28">Date</span>
                <span className="font-bold text-base text-gray-800 w-20">Time</span>
                <span className="font-bold text-base text-gray-800 w-48">Subject</span>
                <span className="font-bold text-base text-gray-800 w-72">To</span>
              </div>

              <hr className="mb-4" />

              {/* Loading state */}
              {loading && (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading sent history...</p>
                </div>
              )}

              {/* No emails */}
              {!loading && emails.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No sent emails found for this proposal.</p>
                </div>
              )}

              {/* Email entries */}
              {!loading && emails.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="bg-cyan-50 border-2 border-cyan-300 rounded-[15px] p-4 hover:bg-cyan-100 transition-colors cursor-pointer"
                      onClick={() => handleEmailClick(email)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-base text-gray-800 w-28">
                          {format(email.sentAt, "MMM d, yyyy")}
                        </span>
                        <span className="text-base text-gray-800 w-20">
                          {format(email.sentAt, "h:mm a")}
                        </span>
                        <span className="text-base text-gray-800 w-48 truncate" title={email.subject}>
                          {email.subject}
                        </span>
                        <span className="text-base text-gray-800 w-72 truncate" title={email.to.join(", ")}>
                          {email.to.join(", ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            selectedEmail && (
              <>
                <button
                  onClick={handleBackToList}
                  className="text-xl font-bold text-gray-800 mb-4 hover:text-gray-600 transition-colors"
                >
                  ← Email
                </button>

                <div className="flex flex-col h-full">
                  {/* Header Info - Fixed at top */}
                  <div className="flex-shrink-0">
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-4">
                      {/* Labels Column */}
                      <div className="flex-shrink-0 lg:w-32 space-y-4">
                        <div className="font-bold text-base text-gray-800">Date:</div>
                        <div className="font-bold text-base text-gray-800">To:</div>
                        <div className="font-bold text-base text-gray-800">Cc:</div>
                        <div className="font-bold text-base text-gray-800">Subject:</div>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 space-y-4 min-h-0">
                        <div className="text-base text-gray-800 break-words">
                          {format(selectedEmail.sentAt, "MMM d, yyyy")}
                        </div>

                        <div className="text-base text-gray-800 break-words">
                          {selectedEmail.to.join(", ")}
                        </div>

                        <div className="text-base text-gray-800 break-words">
                          {selectedEmail.cc ? selectedEmail.cc.join(", ") : "N/A"}
                        </div>

                        <div className="text-base text-gray-800 break-words">
                          {selectedEmail.subject}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Area - Scrollable middle section */}
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">
                    {/* Message Label */}
                    <div className="flex-shrink-0 lg:w-32">
                      <div className="font-bold text-base text-gray-800">Message:</div>
                    </div>

                    {/* Message Content - Scrollable */}
                    <div className="flex-1 min-h-0">
                      <div className="text-base text-gray-800 whitespace-pre-line break-words h-60 overflow-y-auto bg-gray-50 p-3 rounded">
                        {selectedEmail.body}
                      </div>
                    </div>
                  </div>

                  {/* Attachments - Fixed at bottom */}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="flex-shrink-0 flex flex-col lg:flex-row gap-4 lg:gap-6 mt-auto">
                      {/* Attachments Label */}
                      <div className="flex-shrink-0 lg:w-32">
                        <div className="font-bold text-base text-gray-800">Attachments:</div>
                      </div>

                      {/* Attachments Content */}
                      <div className="flex-1 space-y-2">
                        {selectedEmail.attachments.map((attachment, index) => (
                          <div key={index} className="break-words">
                            <button
                              onClick={() => handleAttachmentClick(attachment)}
                              className="text-base text-blue-600 underline hover:text-blue-800 break-all cursor-pointer bg-transparent border-none p-0"
                            >
                              {attachment.fileName}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>
        </div>
      </DialogContent>

      {/* File Viewer Dialog */}
      <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none bg-white rounded-[20px] p-0 border-0 shadow-lg">
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {selectedAttachment?.fileName || 'File Viewer'}
              </h2>
              <div className="h-[calc(100%-4rem)]">
                <iframe
                  src={selectedAttachment?.fileUrl}
                  className="w-full h-full border rounded-lg"
                  title={selectedAttachment?.fileName || 'File Viewer'}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}