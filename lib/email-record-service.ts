import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface EmailRecord {
  from: string
  to: string[]
  cc?: string[]
  subject: string
  body: string
  email_type: "CE" | "quotation" | "report" | "proposals" | "invitation" | "general"
  status: "sent" | "failed"
  userId: string
  templateId?: string
  reportId?: string
  proposalId?: string
  quotationId?: string
  costEstimateId?: string
  attachments?: Array<{
    fileName: string
    fileSize: number
    fileType: string
    fileUrl?: string
  }>
  created: Timestamp
  sentAt: Timestamp
  updated: Timestamp
}

export async function createEmailRecord(
  emailData: Omit<EmailRecord, "created" | "sentAt" | "updated">,
): Promise<string> {
  try {
    const now = Timestamp.now()

    const emailRecord: EmailRecord = {
      ...emailData,
      created: now,
      sentAt: now,
      updated: now,
    }

    // Clean undefined values
    const cleanEmailRecord = Object.fromEntries(Object.entries(emailRecord).filter(([_, value]) => value !== undefined))

    const docRef = await addDoc(collection(db, "emails"), cleanEmailRecord)
    console.log("Email record created with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creating email record:", error)
    throw new Error("Failed to create email record")
  }
}
