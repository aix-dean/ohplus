import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface EmailAttachment {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

export interface Email {
  id?: string
  from: string
  to: string[]
  cc?: string[]
  subject: string
  body: string
  attachments?: EmailAttachment[]
  reportId?: string
  templateId?: string
  status: "draft" | "sending" | "sent" | "failed"
  userId: string
  created?: Timestamp
  updated?: Timestamp
  messageId?: string
  error?: string
}

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  body: string
  userId: string
  created?: Timestamp
  updated?: Timestamp
}

class EmailService {
  private checkFirestore() {
    if (!db) {
      throw new Error("Firestore is not initialized. This function can only be called on the client side.")
    }
  }

  // Email CRUD operations
  async createEmail(emailData: Omit<Email, "id" | "created">): Promise<string> {
    this.checkFirestore()

    try {
      const newEmail = {
        ...emailData,
        created: serverTimestamp(),
        updated: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db!, "compose_emails"), newEmail)
      console.log("Email record created with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("Error creating email:", error)
      throw new Error(`Failed to create email record: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    this.checkFirestore()

    try {
      const emailDoc = await getDoc(doc(db!, "compose_emails", emailId))

      if (emailDoc.exists()) {
        return { id: emailDoc.id, ...emailDoc.data() } as Email
      }

      return null
    } catch (error) {
      console.error("Error fetching email:", error)
      throw new Error(`Failed to fetch email: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async updateEmailStatus(emailId: string, status: Email["status"], messageId?: string, error?: string): Promise<void> {
    this.checkFirestore()

    try {
      const updateData: any = {
        status,
        updated: serverTimestamp(),
      }

      if (messageId) {
        updateData.messageId = messageId
      }

      if (error) {
        updateData.error = error
      }

      await updateDoc(doc(db!, "compose_emails", emailId), updateData)
      console.log("Email status updated:", { emailId, status, messageId })
    } catch (error) {
      console.error("Error updating email status:", error)
      throw new Error(`Failed to update email status: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getUserEmails(userId: string): Promise<Email[]> {
    this.checkFirestore()

    try {
      const emailsRef = collection(db!, "compose_emails")
      const q = query(emailsRef, where("userId", "==", userId), orderBy("created", "desc"))
      const querySnapshot = await getDocs(q)

      const emails: Email[] = []
      querySnapshot.forEach((doc) => {
        emails.push({ id: doc.id, ...doc.data() } as Email)
      })

      return emails
    } catch (error) {
      console.error("Error fetching user emails:", error)
      throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Template CRUD operations
  async createEmailTemplate(templateData: Omit<EmailTemplate, "id" | "created">): Promise<string> {
    this.checkFirestore()

    try {
      const newTemplate = {
        ...templateData,
        created: serverTimestamp(),
        updated: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db!, "email_templates"), newTemplate)
      console.log("Email template created with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("Error creating email template:", error)
      throw new Error(`Failed to create email template: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    this.checkFirestore()

    try {
      const templatesRef = collection(db!, "email_templates")
      const q = query(templatesRef, where("userId", "==", userId), orderBy("name", "asc"))
      const querySnapshot = await getDocs(q)

      const templates: EmailTemplate[] = []
      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() } as EmailTemplate)
      })

      return templates
    } catch (error) {
      console.error("Error fetching email templates:", error)
      throw new Error(`Failed to fetch email templates: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async createDefaultTemplates(userId: string): Promise<void> {
    this.checkFirestore()

    const defaultTemplates: Omit<EmailTemplate, "id" | "created">[] = [
      {
        name: "Report Delivery",
        subject: "Report Ready for Review",
        body: `Hi [Customer's Name],

I hope you're doing well.

Attached is the report you requested. We've prepared a comprehensive analysis based on your requirements and current project status.

Please feel free to review and let me know if you have any questions or would like to explore additional options. I'm happy to assist.

Looking forward to your feedback!

Best regards,
[Your Full Name]
[Your Position]
[Company Name]
[Contact Info]`,
        userId,
      },
      {
        name: "Follow-up",
        subject: "Following up on your report",
        body: `Hi [Customer's Name],

I wanted to follow up on the report I sent earlier. Have you had a chance to review it?

If you have any questions or need clarification on any part of the report, please don't hesitate to reach out. I'm here to help.

Best regards,
[Your Full Name]`,
        userId,
      },
      {
        name: "Urgent Report",
        subject: "URGENT: Report requires immediate attention",
        body: `Hi [Customer's Name],

This is an urgent report that requires your immediate attention.

Please review the attached document as soon as possible and let me know if you need any clarification.

Thank you for your prompt attention to this matter.

Best regards,
[Your Full Name]`,
        userId,
      },
    ]

    try {
      for (const template of defaultTemplates) {
        await this.createEmailTemplate(template)
      }
      console.log("Default email templates created successfully")
    } catch (error) {
      console.error("Error creating default templates:", error)
      throw new Error(`Failed to create default templates: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Send email function
  async sendEmail(emailId: string): Promise<void> {
    try {
      // Update status to sending
      await this.updateEmailStatus(emailId, "sending")

      // Get email data
      const email = await this.getEmailById(emailId)
      if (!email) {
        throw new Error("Email not found")
      }

      console.log("Sending email via API:", {
        emailId,
        to: email.to,
        subject: email.subject,
      })

      // Send email via API route
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailId,
          from: email.from,
          to: email.to,
          cc: email.cc,
          subject: email.subject,
          body: email.body,
          attachments: email.attachments,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email")
      }

      // Update status to sent
      await this.updateEmailStatus(emailId, "sent", result.messageId)
      console.log("Email sent successfully:", result)
    } catch (error) {
      console.error("Error sending email:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Update status to failed
      await this.updateEmailStatus(emailId, "failed", undefined, errorMessage)
      throw error
    }
  }
}

export const emailService = new EmailService()
