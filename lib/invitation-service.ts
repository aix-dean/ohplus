import { db } from "@/lib/firebase"
import { collection, doc, getDocs, query, where, addDoc, deleteDoc, updateDoc } from "firebase/firestore"

export type InvitationCode = {
  id: string
  code: string
  licenseKey: string
  description: string
  maxUses: number
  usedCount: number
  expiresAt: number
  createdAt: number
  createdBy: string
}

// Generate a random invitation code
function generateInvitationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Create a new invitation code
export async function createInvitationCode(params: {
  licenseKey: string
  description: string
  maxUses: number
  expiresInDays: number
  createdBy?: string
}): Promise<InvitationCode> {
  try {
    const code = generateInvitationCode()
    const now = Date.now()
    const expiresAt = now + params.expiresInDays * 24 * 60 * 60 * 1000

    const invitationData = {
      code,
      licenseKey: params.licenseKey,
      description: params.description,
      maxUses: params.maxUses,
      usedCount: 0,
      expiresAt,
      createdAt: now,
      createdBy: params.createdBy || "system",
    }

    const docRef = await addDoc(collection(db, "invitation_codes"), invitationData)

    return {
      id: docRef.id,
      ...invitationData,
    }
  } catch (error) {
    console.error("Error creating invitation code:", error)
    throw new Error("Failed to create invitation code")
  }
}

// Get all invitation codes for a license key
export async function getInvitationCodes(licenseKey: string): Promise<InvitationCode[]> {
  try {
    const q = query(collection(db, "invitation_codes"), where("licenseKey", "==", licenseKey))

    const querySnapshot = await getDocs(q)
    const codes: InvitationCode[] = []

    querySnapshot.forEach((doc) => {
      codes.push({
        id: doc.id,
        ...doc.data(),
      } as InvitationCode)
    })

    // Sort by creation date (newest first)
    return codes.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error("Error getting invitation codes:", error)
    throw new Error("Failed to get invitation codes")
  }
}

// Validate and use an invitation code
export async function validateAndUseInvitationCode(code: string): Promise<{
  isValid: boolean
  licenseKey?: string
  error?: string
}> {
  try {
    const q = query(collection(db, "invitation_codes"), where("code", "==", code.toUpperCase()))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { isValid: false, error: "Invalid invitation code" }
    }

    const inviteDoc = querySnapshot.docs[0]
    const inviteData = inviteDoc.data() as InvitationCode

    const now = Date.now()

    // Check if expired
    if (now > inviteData.expiresAt) {
      return { isValid: false, error: "Invitation code has expired" }
    }

    // Check if max uses reached
    if (inviteData.usedCount >= inviteData.maxUses) {
      return { isValid: false, error: "Invitation code has reached maximum uses" }
    }

    // Increment usage count
    await updateDoc(doc(db, "invitation_codes", inviteDoc.id), {
      usedCount: inviteData.usedCount + 1,
    })

    return {
      isValid: true,
      licenseKey: inviteData.licenseKey,
    }
  } catch (error) {
    console.error("Error validating invitation code:", error)
    return { isValid: false, error: "Failed to validate invitation code" }
  }
}

// Delete an invitation code
export async function deleteInvitationCode(codeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "invitation_codes", codeId))
  } catch (error) {
    console.error("Error deleting invitation code:", error)
    throw new Error("Failed to delete invitation code")
  }
}

// Get invitation code by code string
export async function getInvitationCodeByCode(code: string): Promise<InvitationCode | null> {
  try {
    const q = query(collection(db, "invitation_codes"), where("code", "==", code.toUpperCase()))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
    } as InvitationCode
  } catch (error) {
    console.error("Error getting invitation code:", error)
    return null
  }
}
