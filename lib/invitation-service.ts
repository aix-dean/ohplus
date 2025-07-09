import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface InvitationCode {
  id: string
  code: string
  companyId: string
  description: string
  maxUses: number
  usedCount: number
  createdAt: Date
  expiresAt?: Date
  createdBy: string
}

export interface CreateInvitationCodeData {
  companyId: string
  description: string
  maxUses: number
  expiresAt?: Date
}

// Generate a random 8-character alphanumeric code
function generateInvitationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createInvitationCode(data: CreateInvitationCodeData): Promise<string> {
  const code = generateInvitationCode()

  const invitationData = {
    code,
    companyId: data.companyId,
    description: data.description,
    maxUses: data.maxUses,
    usedCount: 0,
    createdAt: Timestamp.now(),
    expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
    createdBy: "current-user", // You might want to pass this as a parameter
  }

  const docRef = await addDoc(collection(db, "invitationCodes"), invitationData)
  return docRef.id
}

export async function getInvitationCodes(companyId: string): Promise<InvitationCode[]> {
  const q = query(collection(db, "invitationCodes"), where("companyId", "==", companyId), orderBy("createdAt", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      code: data.code,
      companyId: data.companyId,
      description: data.description,
      maxUses: data.maxUses,
      usedCount: data.usedCount,
      createdAt: data.createdAt.toDate(),
      expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined,
      createdBy: data.createdBy,
    }
  })
}

export async function validateInvitationCode(code: string): Promise<{
  valid: boolean
  companyId?: string
  error?: string
}> {
  const q = query(collection(db, "invitationCodes"), where("code", "==", code.toUpperCase()))

  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) {
    return { valid: false, error: "Invalid invitation code" }
  }

  const doc = querySnapshot.docs[0]
  const data = doc.data()

  // Check if expired
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    return { valid: false, error: "Invitation code has expired" }
  }

  // Check if max uses reached
  if (data.usedCount >= data.maxUses) {
    return { valid: false, error: "Invitation code has reached maximum uses" }
  }

  return { valid: true, companyId: data.companyId }
}

export async function useInvitationCode(code: string): Promise<string> {
  const validation = await validateInvitationCode(code)

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const q = query(collection(db, "invitationCodes"), where("code", "==", code.toUpperCase()))

  const querySnapshot = await getDocs(q)
  const docRef = querySnapshot.docs[0].ref

  // Increment the used count
  await updateDoc(docRef, {
    usedCount: increment(1),
  })

  return validation.companyId!
}

export async function deleteInvitationCode(codeId: string): Promise<void> {
  await deleteDoc(doc(db, "invitationCodes", codeId))
}

export async function getInvitationCodeByCode(code: string): Promise<InvitationCode | null> {
  const q = query(collection(db, "invitationCodes"), where("code", "==", code.toUpperCase()))

  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) {
    return null
  }

  const docData = querySnapshot.docs[0]
  const data = docData.data()

  return {
    id: docData.id,
    code: data.code,
    companyId: data.companyId,
    description: data.description,
    maxUses: data.maxUses,
    usedCount: data.usedCount,
    createdAt: data.createdAt.toDate(),
    expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined,
    createdBy: data.createdBy,
  }
}
