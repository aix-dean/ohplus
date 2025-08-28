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

// Email types (simplified - no attachments stored in Firestore)
export interface Email {
  id?: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  templateId?: string
  reportId?: string
  email_type?: "CE" | "quotation" | "report" | "proposals" | "invitation" | "general"
  status: "draft" | "sending" | "sent" | "failed"
  userId: string
  created?: Timestamp
  sent?: Timestamp
  updated?: Timestamp
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
  private emailsCollection = "emails"
  private templatesCollection = "email_templates"

  // Email CRUD operations
  async createEmail(emailData: Omit<Email, "id" | "created">): Promise<string> {
    try {
      // Clean undefined values
      const cleanEmailData = Object.fromEntries(Object.entries(emailData).filter(([_, value]) => value !== undefined))

      const docRef = await addDoc(collection(db, this.emailsCollection), {
        ...cleanEmailData,
        created: Timestamp.now(),
      })
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
        return { id: emailDoc.id, ...emailDoc.data() } as Email
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
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Email[]
    } catch (error) {
      console.error("Error getting emails:", error)
      throw new Error("Failed to get emails")
    }
  }

  async updateEmail(emailId: string, updates: Partial<Email>): Promise<void> {
    try {
      // Clean undefined values
      const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))

      await updateDoc(doc(db, this.emailsCollection, emailId), cleanUpdates)
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

  async createEmailRecord(emailData: {
    from: string
    to: string[]
    cc?: string[]
    subject: string
    body: string
    email_type: "CE" | "quotation" | "report" | "proposals" | "invitation" | "general"
    userId: string
    templateId?: string
    reportId?: string
  }): Promise<string> {
    try {
      const cleanEmailData = Object.fromEntries(Object.entries(emailData).filter(([_, value]) => value !== undefined))

      const docRef = await addDoc(collection(db, this.emailsCollection), {
        ...cleanEmailData,
        status: "sent",
        created: Timestamp.now(),
        sentAt: Timestamp.now(),
        updated: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating email record:", error)
      throw new Error("Failed to create email record")
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
