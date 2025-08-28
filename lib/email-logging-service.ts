import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Email record structure matching the Firebase collection
export interface EmailRecord {
  id?: string
  attachments?: Array<{
    fileName: string
    fileSize: number
    fileType: string
    fileUrl: string
  }>
  body: string
  created: Timestamp
  from: string
  reportId?: string
  quotationId?: string
  proposalId?: string
  costEstimateId?: string
  sentAt: Timestamp
  status: "sent" | "failed" | "pending"
  subject: string
  templateId?: string
  to: string[]
  cc?: string[]
  updated: Timestamp
  userId: string
  email_type: "CE" | "quotation" | "report" | "proposals" | "invitation"
}

class EmailLoggingService {
  private emailsCollection = "emails"

  async logEmail(emailData: {
    from: string
    to: string[]
    cc?: string[]
    subject: string
    body: string
    userId: string
    email_type: "CE" | "quotation" | "report" | "proposals" | "invitation"
    reportId?: string
    quotationId?: string
    proposalId?: string
    costEstimateId?: string
    templateId?: string
    attachments?: Array<{
      fileName: string
      fileSize: number
      fileType: string
      fileUrl: string
    }>
    status?: "sent" | "failed" | "pending"
  }): Promise<string> {
    try {
      const now = Timestamp.now()

      const emailRecord: Omit<EmailRecord, "id"> = {
        attachments: emailData.attachments || [],
        body: emailData.body,
        created: now,
        from: emailData.from,
        reportId: emailData.reportId,
        quotationId: emailData.quotationId,
        proposalId: emailData.proposalId,
        costEstimateId: emailData.costEstimateId,
        sentAt: now,
        status: emailData.status || "sent",
        subject: emailData.subject,
        templateId: emailData.templateId,
        to: emailData.to,
        cc: emailData.cc,
        updated: now,
        userId: emailData.userId,
        email_type: emailData.email_type,
      }

      // Clean undefined values
      const cleanEmailRecord = Object.fromEntries(
        Object.entries(emailRecord).filter(([_, value]) => value !== undefined),
      )

      const docRef = await addDoc(collection(db, this.emailsCollection), cleanEmailRecord)
      console.log(`Email record logged with ID: ${docRef.id}, type: ${emailData.email_type}`)
      return docRef.id
    } catch (error) {
      console.error("Error logging email record:", error)
      throw new Error("Failed to log email record")
    }
  }
}

export const emailLoggingService = new EmailLoggingService()
