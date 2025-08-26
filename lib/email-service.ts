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
  company_id?: string
  deleted?: boolean
  created?: Timestamp
}

class EmailService {
  private emailsCollection = "compose_emails"
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

  async getEmailTemplates(companyId: string): Promise<EmailTemplate[]> {
    try {
      const q = query(
        collection(db, this.templatesCollection),
        where("company_id", "==", companyId),
        where("deleted", "==", false),
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
      await updateDoc(doc(db, this.templatesCollection, templateId), { deleted: true })
    } catch (error) {
      console.error("Error deleting email template:", error)
      throw new Error("Failed to delete email template")
    }
  }

  async createDefaultTemplates(companyId: string): Promise<void> {
    const defaultTemplates = [
      {
        name: "Cost Estimate Template 1",
        subject: "Cost Estimate: {title} - OH Plus",
        body: `Hi {clientName},

I hope you're doing well!

Please find attached the quotation for your upcoming billboard campaign. The proposal includes the site location, duration, and pricing details based on our recent discussion.

If you have any questions or would like to explore other options, feel free to reach out. I'll be happy to assist you further. Looking forward to your feedback!

Best regards,
{userName}
Sales Executive
{companyName}
{userContact}
{userEmail}`,
        company_id: companyId,
        deleted: false,
      },
      {
        name: "Cost Estimate Template 2",
        subject: "Your Advertising Campaign Quote - {title}",
        body: `Dear {clientName},

Thank you for your interest in our advertising services. We are pleased to provide you with a detailed cost estimate for your campaign.

Please review the attached quotation and let us know if you have any questions or require any modifications.

We look forward to working with you!

Best regards,
{userName}
{companyName}`,
        company_id: companyId,
        deleted: false,
      },
      {
        name: "Cost Estimate Template 3",
        subject: "Billboard Campaign Proposal - {title}",
        body: `Hello {clientName},

We've prepared a comprehensive cost estimate for your billboard advertising campaign. The attached document includes all the details we discussed.

Please take your time to review it and don't hesitate to contact us with any questions.

Thank you for considering OH Plus for your advertising needs.

Best regards,
{userName}`,
        company_id: companyId,
        deleted: false,
      },
      {
        name: "Cost Estimate Template 4",
        subject: "Cost Estimate Ready for Review - {title}",
        body: `Dear {clientName},

Your cost estimate is ready! We've carefully prepared a detailed proposal that aligns with your requirements and budget considerations.

The attached document contains all the information you need to make an informed decision about your advertising campaign.

We're excited about the possibility of working together!

Best regards,
{userName}
Sales Executive
{companyName}`,
        company_id: companyId,
        deleted: false,
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
