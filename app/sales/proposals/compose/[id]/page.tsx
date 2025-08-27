"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Paperclip, X, Edit, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import type { Proposal } from "@/lib/types/proposal"

interface FileAttachment {
  file: File
  fileName: string
  fileSize: number
  fileType: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

export default function ComposeProposalEmailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const proposalId = params.id as string
  const [proposal, setProposal] = useState<Proposal | null>(null)

  // Email form state
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  // Templates state
  const [templates] = useState<EmailTemplate[]>([
    {
      id: "1",
      name: "Standard",
      subject: "Cost Estimate for [Site Name] - OH Plus",
      body: "Hi [Client Name],\n\nI hope you're doing well.\n\nPlease find attached the cost estimate for your upcoming billboard campaign. The proposal includes the site details and pricing details based on our recent discussion.\n\nIf you have any questions or would like to explore other options, feel free to reach out. I'll be happy to assist you further. Looking forward to your feedback!\n\nBest regards,\nSales Executive\nSales Executive\nOH Plus\n+63 XXX XXX XXXX",
    },
    {
      id: "2",
      name: "Cost Estimate Template 4",
      subject: "Cost Estimate Template 4 - OH Plus",
      body: "Template 4 content...",
    },
    {
      id: "3",
      name: "Cost Estimate Template 3",
      subject: "Cost Estimate Template 3 - OH Plus",
      body: "Template 3 content...",
    },
    {
      id: "4",
      name: "Cost Estimate Template 2",
      subject: "Cost Estimate Template 2 - OH Plus",
      body: "Template 2 content...",
    },
    {
      id: "5",
      name: "Cost Estimate Template 1",
      subject: "Cost Estimate Template 1 - OH Plus",
      body: "Template 1 content...",
    },
  ])

  // UI state
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (proposalId) {
      fetchProposal()
    }
  }, [proposalId])

  const fetchProposal = async () => {
    try {
      // Mock proposal data - replace with actual API call
      const mockProposal: Proposal = {
        id: proposalId,
        code: "SUM0081",
        title: "Golden Touch Site Proposals (3 Sites)",
        client: {
          id: "1",
          company: "Golden Touch Sites",
          contactPerson: "John Doe",
          email: "j.king@aix.ph",
        },
        products: [],
        totalAmount: 0,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setProposal(mockProposal)

      // Set default values
      setTo("j.king@aix.ph")
      setCc("akaymebatag@aix.com")
      setSubject(
        `Cost Estimate: Cost Estimate for ${mockProposal.client.company} | Kalayaan Flyover Site D - AIX - OH Plus`,
      )
      setBody(`Hi AIX,

I hope you're doing well!

Please find attached the quotation for your upcoming billboard campaign. The proposal includes the site details and pricing details based on our recent discussion.

If you have any questions or would like to explore other options, feel free to reach out. I'll be happy to assist you further. Looking forward to your feedback!

Best regards,
Sales Executive
Sales Executive
OH Plus
+63 XXX XXX XXXX`)

      // Mock attachments
      setAttachments([
        {
          file: new File([], "OH_SU_CEST592782147_AIX_Cost_Estimate_Page_1.pdf"),
          fileName: "OH_SU_CEST592782147_AIX_Cost_Estimate_Page_1.pdf",
          fileSize: 2048000,
          fileType: "application/pdf",
        },
        {
          fileName: "OH_SU_CEST592782147_AIX_Cost_Estimate_Page_2.pdf",
          fileSize: 1536000,
          fileType: "application/pdf",
        } as FileAttachment,
      ])
    } catch (error) {
      console.error("Error fetching proposal:", error)
      toast({
        title: "Error",
        description: "Failed to load proposal data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newAttachments: FileAttachment[] = []

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 10MB and cannot be attached.`,
          variant: "destructive",
        })
        return
      }

      const attachment: FileAttachment = {
        file: file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
      }

      newAttachments.push(attachment)
    })

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSubject(template.subject)
    setBody(template.body)
  }

  const handleSendEmail = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      const response = await fetch("/api/proposals/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposal,
          clientEmail: to,
          subject,
          body,
          currentUserEmail: user?.email,
          ccEmail: cc,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      toast({
        title: "Email Sent!",
        description: "Your proposal email has been sent successfully.",
      })

      router.push(`/sales/proposals/${proposalId}`)
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Send Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading compose email...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <input ref={fileInputRef} type="file" multiple accept="*/*" onChange={handleFileSelect} className="hidden" />

      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm border-b">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">Compose Email</h1>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Compose Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* To Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                  <Input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full"
                  />
                </div>

                {/* CC Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cc:</label>
                  <Input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="w-full"
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full"
                  />
                </div>

                {/* Body Field */}
                <div>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full min-h-[300px] resize-none border-0 p-0 focus-visible:ring-0"
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachments:</label>
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-blue-600 flex-1">{attachment.fileName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="link"
                      onClick={handleAddAttachment}
                      className="text-blue-600 p-0 h-auto font-normal"
                    >
                      +Add Attachment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Sidebar */}
          <div>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Templates:</h3>

                <div className="space-y-2">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateSelect(template)}
                        className="flex-1 justify-start text-left h-8 text-xs"
                      >
                        {template.name}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                  >
                    +Add Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Send Button */}
            <div className="mt-4">
              <Button
                onClick={handleSendEmail}
                disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
