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
  type: string // Added type field for categorizing templates
  userId: string
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

  async getEmailTemplatesByType(userId: string, type: string): Promise<EmailTemplate[]> {
    try {
      const q = query(
        collection(db, this.templatesCollection),
        where("userId", "==", userId),
        where("type", "==", type),
        orderBy("created", "desc"),
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailTemplate[]
    } catch (error) {
      console.error("Error getting email templates by type:", error)
      throw new Error("Failed to get email templates by type")
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
        name: "Standard Proposal",
        subject: "Proposal: [Proposal Title] - [Client Company] - OH Plus",
        body: `Hi [Client Name],

I hope you're doing well!

Please find attached the proposal for your upcoming advertising campaign. The proposal includes the site details and pricing details based on our recent discussion.

If you have any questions or would like to explore other options, feel free to reach out to us. I'll be happy to assist you further. Looking forward to your feedback!

Best regards,
Sales Executive
OH PLUS
+639XXXXXXXXX`,
        type: "PROPOSALS", // Set type to PROPOSALS for proposal templates
        userId,
      },
      {
        name: "Follow-up Proposal",
        subject: "Follow-up: [Proposal Title] - [Client Company]",
        body: `Dear [Client Name],

I wanted to follow up on the proposal we sent regarding your advertising campaign.

Have you had a chance to review the attached proposal? We're excited about the opportunity to work with [Client Company] and would be happy to discuss any questions or modifications you might have.

Please let me know if you'd like to schedule a call to go over the details or if you need any additional information.

Looking forward to hearing from you!

Best regards,
Sales Executive
OH PLUS`,
        type: "PROPOSALS", // Set type to PROPOSALS for proposal templates
        userId,
      },
      {
        name: "Proposal Revision",
        subject: "Revised Proposal: [Proposal Title] - [Client Company]",
        body: `Hi [Client Name],

Thank you for your feedback on our initial proposal.

Based on our discussion, I've prepared a revised proposal that addresses your requirements and budget considerations. Please find the updated proposal attached.

The key changes include:
- [Change 1]
- [Change 2]
- [Change 3]

I believe this revised proposal better aligns with your needs. Please review and let me know your thoughts.

Best regards,
Sales Executive
OH PLUS`,
        type: "PROPOSALS", // Set type to PROPOSALS for proposal templates
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
