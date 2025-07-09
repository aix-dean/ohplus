import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Helper function to check if Firebase is available
const isFirebaseAvailable = () => {
  return typeof window !== "undefined" && db !== null
}

export interface EmailAttachment {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

export interface Email {
  id: string
  from: string
  to: string[]
  cc?: string[]
  subject: string
  body: string
  attachments?: EmailAttachment[]
  status: "draft" | "sending" | "sent" | "failed"
  userId: string
  reportId?: string
  templateId?: string
  created: Timestamp
  updated?: Timestamp
  sentAt?: Timestamp
  errorMessage?: string
}

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  body: string
  category: string
  userId: string
  created?: Timestamp
  updated?: Timestamp
}

class EmailService {
  // Email CRUD operations
  async createEmail(emailData: Omit<Email, "id" | "created">): Promise<string> {
    if (!isFirebaseAvailable()) {
      throw new Error("Firebase not available - cannot create email record")
    }

    try {
      const emailWithTimestamp = {
        ...emailData,
        created: serverTimestamp(),
        status: "draft" as const,
      }

      const docRef = await addDoc(collection(db, "compose_emails"), emailWithTimestamp)
      console.log("Email record created with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("Error creating email:", error)
      throw new Error(`Failed to create email record: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    if (!isFirebaseAvailable()) {
      console.error("Firebase not available - cannot fetch email")
      return null
    }

    try {
      const emailDoc = await getDoc(doc(db, "compose_emails", emailId))
      if (emailDoc.exists()) {
        return { id: emailDoc.id, ...emailDoc.data() } as Email
      }
      return null
    } catch (error) {
      console.error("Error fetching email:", error)
      return null
    }
  }

  async updateEmailStatus(emailId: string, status: Email["status"], errorMessage?: string): Promise<void> {
    if (!isFirebaseAvailable()) {
      throw new Error("Firebase not available - cannot update email status")
    }

    try {
      const updateData: any = {
        status,
        updated: serverTimestamp(),
      }

      if (status === "sent") {
        updateData.sentAt = serverTimestamp()
      }

      if (errorMessage) {
        updateData.errorMessage = errorMessage
      }

      await updateDoc(doc(db, "compose_emails", emailId), updateData)
    } catch (error) {
      console.error("Error updating email status:", error)
      throw error
    }
  }

  async getUserEmails(userId: string): Promise<Email[]> {
    if (!isFirebaseAvailable()) {
      console.error("Firebase not available - cannot fetch user emails")
      return []
    }

    try {
      const q = query(collection(db, "compose_emails"), where("userId", "==", userId), orderBy("created", "desc"))
      const querySnapshot = await getDocs(q)

      const emails: Email[] = []
      querySnapshot.forEach((doc) => {
        emails.push({ id: doc.id, ...doc.data() } as Email)
      })

      return emails
    } catch (error) {
      console.error("Error fetching user emails:", error)
      return []
    }
  }

  // Email sending
  async sendEmail(emailId: string): Promise<void> {
    try {
      console.log(`Starting send process for email ID: ${emailId}`)

      // Get email from database
      const email = await this.getEmailById(emailId)
      if (!email) {
        throw new Error("Email not found in database")
      }

      console.log("Email data retrieved:", {
        from: email.from,
        to: email.to,
        subject: email.subject,
        attachmentCount: email.attachments?.length || 0,
      })

      // Update status to sending
      await this.updateEmailStatus(emailId, "sending")

      // Prepare email data for API
      const emailPayload = {
        emailId,
        from: email.from,
        to: email.to,
        cc: email.cc,
        subject: email.subject,
        body: email.body,
        attachments: email.attachments || [],
      }

      console.log("Sending to API endpoint...")

      // Send email via API route
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("API error response:", result)
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      console.log("Email sent successfully via API:", result)

      // Update status to sent
      await this.updateEmailStatus(emailId, "sent")
    } catch (error) {
      console.error("Error in sendEmail:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      // Update status to failed
      try {
        await this.updateEmailStatus(emailId, "failed", errorMessage)
      } catch (updateError) {
        console.error("Error updating email status to failed:", updateError)
      }

      throw new Error(`Failed to send email: ${errorMessage}`)
    }
  }

  // Template CRUD operations
  async createEmailTemplate(templateData: Omit<EmailTemplate, "id" | "created">): Promise<string> {
    if (!isFirebaseAvailable()) {
      throw new Error("Firebase not available - cannot create template")
    }

    try {
      const templateWithTimestamp = {
        ...templateData,
        created: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "email_templates"), templateWithTimestamp)
      return docRef.id
    } catch (error) {
      console.error("Error creating email template:", error)
      throw error
    }
  }

  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    if (!isFirebaseAvailable()) {
      console.error("Firebase not available - cannot fetch templates")
      return []
    }

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

  async createDefaultTemplates(userId: string): Promise<void> {
    const defaultTemplates: Omit<EmailTemplate, "id" | "created">[] = [
      {
        name: "Report Delivery",
        subject: "Your Report is Ready",
        body: `Hi [Client Name],

I hope this email finds you well.

I'm pleased to inform you that your requested report is now ready for review. The report has been carefully prepared according to your specifications and contains comprehensive analysis of the current status.

Please find the detailed report attached to this email. If you have any questions or need clarification on any aspect of the report, please don't hesitate to reach out.

Thank you for your continued trust in our services.

Best regards,
[Your Name]
[Your Position]
[Company Name]
[Contact Information]`,
        category: "delivery",
        userId,
      },
      {
        name: "Follow-up",
        subject: "Following Up on Your Report",
        body: `Dear [Client Name],

I wanted to follow up on the report I sent earlier to ensure you received it and to see if you have any questions.

The report contains important information regarding your project, and I'd be happy to discuss any aspects in more detail if needed.

Please let me know if there's anything specific you'd like to review or if you need any additional information.

Looking forward to hearing from you.

Best regards,
[Your Name]
[Company Name]`,
        category: "follow-up",
        userId,
      },
      {
        name: "Professional Update",
        subject: "Project Status Update",
        body: `Dear [Client Name],

I hope you're doing well.

As requested, please find attached the latest update on your project. This report includes:

• Current progress status
• Key milestones achieved
• Upcoming deliverables
• Any items requiring your attention

Please review the attached document and let me know if you have any questions or concerns.

I appreciate your continued partnership and look forward to your feedback.

Best regards,
[Your Name]
[Your Title]
[Company Name]
[Phone] | [Email]`,
        category: "update",
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
      throw error
    }
  }
}

export const emailService = new EmailService()
