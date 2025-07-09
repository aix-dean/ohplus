import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Email Template Interface
export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  body: string
  userId: string
  isDefault: boolean
  created: Timestamp | string
  updated?: Timestamp | string
}

// Email Interface
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
  status: "draft" | "sent" | "failed"
  sentAt?: Timestamp | string
  userId: string
  created: Timestamp | string
  updated?: Timestamp | string
  errorMessage?: string
}

// Email Attachment Interface
export interface EmailAttachment {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

// Email Service Class
class EmailService {
  // Email Templates
  async createEmailTemplate(template: Omit<EmailTemplate, "id" | "created">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "email_templates"), {
        ...template,
        created: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating email template:", error)
      throw error
    }
  }

  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    try {
      const q = query(collection(db, "email_templates"), where("userId", "==", userId), orderBy("created", "desc"))
      const querySnapshot = await getDocs(q)

      const templates: EmailTemplate[] = []
      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() } as EmailTemplate)
      })

      return templates
    } catch (error) {
      console.error("Error fetching email templates:", error)
      return []
    }
  }

  async updateEmailTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<void> {
    try {
      const templateRef = doc(db, "email_templates", templateId)
      await updateDoc(templateRef, {
        ...updates,
        updated: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating email template:", error)
      throw error
    }
  }

  async deleteEmailTemplate(templateId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "email_templates", templateId))
    } catch (error) {
      console.error("Error deleting email template:", error)
      throw error
    }
  }

  // Compose Emails - using compose_emails collection
  async createEmail(email: Omit<Email, "id" | "created">): Promise<string> {
    try {
      // Clean the email object to remove undefined values
      const cleanEmail: any = {
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        status: email.status,
        userId: email.userId,
        created: serverTimestamp(),
      }

      // Only add optional fields if they have values
      if (email.cc && email.cc.length > 0) {
        cleanEmail.cc = email.cc
      }
      if (email.bcc && email.bcc.length > 0) {
        cleanEmail.bcc = email.bcc
      }
      if (email.attachments && email.attachments.length > 0) {
        cleanEmail.attachments = email.attachments
      }
      if (email.templateId) {
        cleanEmail.templateId = email.templateId
      }
      if (email.reportId) {
        cleanEmail.reportId = email.reportId
      }
      if (email.sentAt) {
        cleanEmail.sentAt = email.sentAt
      }
      if (email.errorMessage) {
        cleanEmail.errorMessage = email.errorMessage
      }

      const docRef = await addDoc(collection(db, "compose_emails"), cleanEmail)
      return docRef.id
    } catch (error) {
      console.error("Error creating email:", error)
      throw error
    }
  }

  async getEmails(userId: string): Promise<Email[]> {
    try {
      const q = query(collection(db, "compose_emails"), where("userId", "==", userId), orderBy("created", "desc"))
      const querySnapshot = await getDocs(q)

      const emails: Email[] = []
      querySnapshot.forEach((doc) => {
        emails.push({ id: doc.id, ...doc.data() } as Email)
      })

      return emails
    } catch (error) {
      console.error("Error fetching emails:", error)
      return []
    }
  }

  async updateEmail(emailId: string, updates: Partial<Email>): Promise<void> {
    try {
      const emailRef = doc(db, "compose_emails", emailId)

      // Clean updates to remove undefined values
      const cleanUpdates: any = {
        updated: serverTimestamp(),
      }

      Object.keys(updates).forEach((key) => {
        const value = (updates as any)[key]
        if (value !== undefined) {
          cleanUpdates[key] = value
        }
      })

      await updateDoc(emailRef, cleanUpdates)
    } catch (error) {
      console.error("Error updating email:", error)
      throw error
    }
  }

  async sendEmail(emailId: string): Promise<void> {
    try {
      // Get the email document first
      const emailsQuery = query(collection(db, "compose_emails"), where("__name__", "==", emailId))
      const emailSnapshot = await getDocs(emailsQuery)

      if (emailSnapshot.empty) {
        throw new Error("Email not found")
      }

      const emailData = emailSnapshot.docs[0].data() as Email

      // Prepare email for sending via Resend API
      const emailPayload = {
        from: emailData.from || "noreply@ohplus.aix.ph",
        to: emailData.to,
        cc: emailData.cc || [],
        subject: emailData.subject,
        html: this.formatEmailBody(emailData.body),
        attachments: emailData.attachments ? await this.prepareAttachments(emailData.attachments) : [],
      }

      // Send email using Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to send email: ${errorData.message || response.statusText}`)
      }

      const result = await response.json()
      console.log("Email sent successfully:", result)

      // Update email status to sent
      await this.updateEmail(emailId, {
        status: "sent",
        sentAt: serverTimestamp() as any,
      })
    } catch (error) {
      console.error("Error sending email:", error)

      // Update email status to failed with error message
      await this.updateEmail(emailId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      })

      throw error
    }
  }

  private formatEmailBody(body: string): string {
    // Convert plain text to HTML with proper formatting
    return body.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>").replace(/^/, "<p>").replace(/$/, "</p>")
  }

  private async prepareAttachments(attachments: EmailAttachment[]): Promise<any[]> {
    // In a real implementation, you would convert blob URLs to base64 or upload to a CDN
    // For now, we'll return empty array since blob URLs won't work in email sending
    console.log("Attachments would be processed here:", attachments)
    return []
  }

  // Default templates
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
        isDefault: true,
      },
      {
        name: "Project Update",
        subject: "Project Status Update",
        body: `Hi [Customer's Name],

I wanted to provide you with an update on your project.

Attached is the latest progress report showing current status, completed milestones, and upcoming activities. Everything is progressing according to schedule.

If you have any questions or concerns, please don't hesitate to reach out.

Best regards,
[Your Full Name]
[Your Position]
[Company Name]
[Contact Info]`,
        userId,
        isDefault: true,
      },
      {
        name: "Completion Report",
        subject: "Project Completion Report",
        body: `Hi [Customer's Name],

I'm pleased to inform you that your project has been completed successfully.

Attached is the final completion report with all details, photos, and documentation. The project was delivered on time and meets all specified requirements.

Thank you for choosing our services. We look forward to working with you again.

Best regards,
[Your Full Name]
[Your Position]
[Company Name]
[Contact Info]`,
        userId,
        isDefault: true,
      },
    ]

    for (const template of defaultTemplates) {
      await this.createEmailTemplate(template)
    }
  }
}

export const emailService = new EmailService()
