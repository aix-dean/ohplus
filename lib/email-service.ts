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
}

// Email Attachment Interface
export interface EmailAttachment {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

// Helper function to remove undefined values
const removeUndefinedFields = (obj: any): any => {
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value
    }
  }
  return cleaned
}

// Email Service Class
class EmailService {
  // Email Templates
  async createEmailTemplate(template: Omit<EmailTemplate, "id" | "created">): Promise<string> {
    try {
      const cleanedTemplate = removeUndefinedFields({
        ...template,
        created: serverTimestamp(),
      })

      const docRef = await addDoc(collection(db, "email_templates"), cleanedTemplate)
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
      const cleanedUpdates = removeUndefinedFields({
        ...updates,
        updated: serverTimestamp(),
      })

      await updateDoc(templateRef, cleanedUpdates)
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

  // Emails
  async createEmail(email: Omit<Email, "id" | "created">): Promise<string> {
    try {
      const cleanedEmail = removeUndefinedFields({
        ...email,
        created: serverTimestamp(),
      })

      const docRef = await addDoc(collection(db, "emails"), cleanedEmail)
      return docRef.id
    } catch (error) {
      console.error("Error creating email:", error)
      throw error
    }
  }

  async getEmails(userId: string): Promise<Email[]> {
    try {
      const q = query(collection(db, "emails"), where("userId", "==", userId), orderBy("created", "desc"))
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
      const emailRef = doc(db, "emails", emailId)
      const cleanedUpdates = removeUndefinedFields({
        ...updates,
        updated: serverTimestamp(),
      })

      await updateDoc(emailRef, cleanedUpdates)
    } catch (error) {
      console.error("Error updating email:", error)
      throw error
    }
  }

  async sendEmail(emailId: string): Promise<void> {
    try {
      // In a real implementation, this would integrate with an email service like SendGrid, Resend, etc.
      // For now, we'll just update the status
      await this.updateEmail(emailId, {
        status: "sent",
        sentAt: serverTimestamp(),
      })

      console.log("Email sent successfully")
    } catch (error) {
      console.error("Error sending email:", error)
      await this.updateEmail(emailId, { status: "failed" })
      throw error
    }
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
