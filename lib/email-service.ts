import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Email types
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
  bcc?: string[]
  subject: string
  body: string
  attachments?: EmailAttachment[]
  templateId?: string
  reportId?: string
  status: "draft" | "sending" | "sent" | "failed"
  userId: string
  created?: Timestamp
  sent?: Timestamp
  error?: string
}

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  body: string
  userId: string
  created?: Timestamp
}

class EmailService {
  private emailsCollection = "compose_emails"
  private templatesCollection = "email_templates"

  // Email CRUD operations
  async createEmail(emailData: Omit<Email, "id" | "created">): Promise<string> {
    try {
      // Convert the email data to a plain object that Firestore can handle
      const firestoreData: any = {
        from: emailData.from,
        to: Array.isArray(emailData.to) ? [...emailData.to] : [],
        subject: emailData.subject,
        body: emailData.body,
        status: emailData.status,
        userId: emailData.userId,
        created: Timestamp.now(),
      }

      // Add optional arrays only if they exist and have content
      if (emailData.cc && Array.isArray(emailData.cc) && emailData.cc.length > 0) {
        firestoreData.cc = [...emailData.cc]
      }

      if (emailData.bcc && Array.isArray(emailData.bcc) && emailData.bcc.length > 0) {
        firestoreData.bcc = [...emailData.bcc]
      }

      // Add optional strings only if they exist
      if (emailData.templateId) {
        firestoreData.templateId = emailData.templateId
      }

      if (emailData.reportId) {
        firestoreData.reportId = emailData.reportId
      }

      // Handle attachments - convert to plain objects
      if (emailData.attachments && Array.isArray(emailData.attachments) && emailData.attachments.length > 0) {
        firestoreData.attachments = emailData.attachments.map((attachment) => ({
          fileName: String(attachment.fileName || ""),
          fileUrl: String(attachment.fileUrl || ""),
          fileSize: Number(attachment.fileSize || 0),
          fileType: String(attachment.fileType || "application/octet-stream"),
        }))
      }

      const docRef = await addDoc(collection(db, this.emailsCollection), firestoreData)
      return docRef.id
    } catch (error) {
      console.error("Error creating email:", error)
      throw new Error("Failed to create email")
    }
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    try {
      const emailDoc = await getDoc(doc(db, this.emailsCollection, emailId))
      if (emailDoc.exists()) {
        const data = emailDoc.data()
        return {
          id: emailDoc.id,
          from: data.from || "",
          to: Array.isArray(data.to) ? data.to : [],
          cc: Array.isArray(data.cc) ? data.cc : undefined,
          bcc: Array.isArray(data.bcc) ? data.bcc : undefined,
          subject: data.subject || "",
          body: data.body || "",
          attachments: Array.isArray(data.attachments)
            ? data.attachments.map((att: any) => ({
                fileName: att.fileName || "",
                fileUrl: att.fileUrl || "",
                fileSize: att.fileSize || 0,
                fileType: att.fileType || "application/octet-stream",
              }))
            : undefined,
          templateId: data.templateId,
          reportId: data.reportId,
          status: data.status || "draft",
          userId: data.userId || "",
          created: data.created,
          sent: data.sent,
          error: data.error,
        } as Email
      }
      return null
    } catch (error) {
      console.error("Error getting email:", error)
      throw new Error("Failed to get email")
    }
  }

  async getEmails(userId?: string): Promise<Email[]> {
    try {
      let q = query(collection(db, this.emailsCollection), orderBy("created", "desc"))

      if (userId) {
        q = query(collection(db, this.emailsCollection), where("userId", "==", userId), orderBy("created", "desc"))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          from: data.from || "",
          to: Array.isArray(data.to) ? data.to : [],
          cc: Array.isArray(data.cc) ? data.cc : undefined,
          bcc: Array.isArray(data.bcc) ? data.bcc : undefined,
          subject: data.subject || "",
          body: data.body || "",
          attachments: Array.isArray(data.attachments)
            ? data.attachments.map((att: any) => ({
                fileName: att.fileName || "",
                fileUrl: att.fileUrl || "",
                fileSize: att.fileSize || 0,
                fileType: att.fileType || "application/octet-stream",
              }))
            : undefined,
          templateId: data.templateId,
          reportId: data.reportId,
          status: data.status || "draft",
          userId: data.userId || "",
          created: data.created,
          sent: data.sent,
          error: data.error,
        } as Email
      })
    } catch (error) {
      console.error("Error getting emails:", error)
      throw new Error("Failed to get emails")
    }
  }

  async updateEmail(emailId: string, updates: Partial<Email>): Promise<void> {
    try {
      // Convert updates to plain objects that Firestore can handle
      const firestoreUpdates: any = {}

      Object.keys(updates).forEach((key) => {
        const value = (updates as any)[key]
        if (value !== undefined) {
          if (key === "attachments" && Array.isArray(value)) {
            firestoreUpdates[key] = value.map((attachment) => ({
              fileName: String(attachment.fileName || ""),
              fileUrl: String(attachment.fileUrl || ""),
              fileSize: Number(attachment.fileSize || 0),
              fileType: String(attachment.fileType || "application/octet-stream"),
            }))
          } else if (key === "to" || key === "cc" || key === "bcc") {
            if (Array.isArray(value)) {
              firestoreUpdates[key] = [...value]
            }
          } else {
            firestoreUpdates[key] = value
          }
        }
      })

      await updateDoc(doc(db, this.emailsCollection, emailId), firestoreUpdates)
    } catch (error) {
      console.error("Error updating email:", error)
      throw new Error("Failed to update email")
    }
  }

  async deleteEmail(emailId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.emailsCollection, emailId))
    } catch (error) {
      console.error("Error deleting email:", error)
      throw new Error("Failed to delete email")
    }
  }

  async sendEmail(emailId: string): Promise<void> {
    try {
      // Get email from database
      const email = await this.getEmailById(emailId)
      if (!email) {
        throw new Error("Email not found")
      }

      // Update status to sending
      await this.updateEmail(emailId, { status: "sending" })

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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }

      // Update status to sent
      await this.updateEmail(emailId, {
        status: "sent",
        sent: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error sending email:", error)

      // Update status to failed with error message
      await this.updateEmail(emailId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })

      throw error
    }
  }

  // Template CRUD operations
  async createEmailTemplate(templateData: Omit<EmailTemplate, "id" | "created">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.templatesCollection), {
        ...templateData,
        created: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating email template:", error)
      throw new Error("Failed to create email template")
    }
  }

  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    try {
      const q = query(
        collection(db, this.templatesCollection),
        where("userId", "==", userId),
        orderBy("created", "desc"),
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailTemplate[]
    } catch (error) {
      console.error("Error getting email templates:", error)
      throw new Error("Failed to get email templates")
    }
  }

  async updateEmailTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<void> {
    try {
      await updateDoc(doc(db, this.templatesCollection, templateId), updates)
    } catch (error) {
      console.error("Error updating email template:", error)
      throw new Error("Failed to update email template")
    }
  }

  async deleteEmailTemplate(templateId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.templatesCollection, templateId))
    } catch (error) {
      console.error("Error deleting email template:", error)
      throw new Error("Failed to delete email template")
    }
  }

  async createDefaultTemplates(userId: string): Promise<void> {
    const defaultTemplates = [
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
        name: "Project Update",
        subject: "Project Status Update",
        body: `Dear [Customer's Name],

I wanted to provide you with an update on your project progress.

Current Status: [Project Status]
Completion: [Percentage]%
Next Steps: [Next Steps]

Attached you'll find the detailed progress report with all relevant information and documentation.

If you have any questions or concerns, please don't hesitate to reach out.

Best regards,
[Your Full Name]
[Your Position]
[Company Name]`,
        userId,
      },
      {
        name: "Completion Report",
        subject: "Project Completion Report",
        body: `Dear [Customer's Name],

I'm pleased to inform you that your project has been completed successfully!

Project Details:
- Start Date: [Start Date]
- Completion Date: [Completion Date]
- Final Status: Completed

Please find the final completion report attached for your records. This document contains all the details about the work performed and final deliverables.

Thank you for choosing our services. We look forward to working with you again in the future.

Best regards,
[Your Full Name]
[Your Position]
[Company Name]`,
        userId,
      },
    ]

    try {
      for (const template of defaultTemplates) {
        await this.createEmailTemplate(template)
      }
    } catch (error) {
      console.error("Error creating default templates:", error)
      throw new Error("Failed to create default templates")
    }
  }
}

export const emailService = new EmailService()
