import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ProposalTemplate } from "@/lib/types/proposal-template"

// Create a new proposal template
export async function createProposalTemplate(
  templateData: Omit<ProposalTemplate, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  try {
    const newTemplate = {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: templateData.isActive !== undefined ? templateData.isActive : true,
    }

    const docRef = await addDoc(collection(db, "proposal_templates"), newTemplate)
    return docRef.id
  } catch (error) {
    console.error("Error creating proposal template:", error)
    throw error
  }
}

// Get all proposal templates
export async function getProposalTemplates(userId?: string): Promise<ProposalTemplate[]> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    let q = query(collection(db, "proposal_templates"), where("isActive", "==", true), orderBy("createdAt", "desc"))

    // Filter by user if provided
    if (userId) {
      q = query(q, where("createdBy", "==", userId))
    }

    const querySnapshot = await getDocs(q)
    const templates: ProposalTemplate[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      templates.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
      } as ProposalTemplate)
    })

    return templates
  } catch (error) {
    console.error("Error fetching proposal templates:", error)
    return []
  }
}

// Get a single proposal template by ID
export async function getProposalTemplateById(templateId: string): Promise<ProposalTemplate | null> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const templateDoc = await getDoc(doc(db, "proposal_templates", templateId))

    if (templateDoc.exists()) {
      const data = templateDoc.data()
      return {
        id: templateDoc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
      } as ProposalTemplate
    }

    return null
  } catch (error) {
    console.error("Error fetching proposal template:", error)
    return null
  }
}

// Update a proposal template
export async function updateProposalTemplate(
  templateId: string,
  templateData: Partial<ProposalTemplate>,
): Promise<void> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const templateRef = doc(db, "proposal_templates", templateId)
    const updateData = {
      ...templateData,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(templateRef, updateData)
  } catch (error) {
    console.error("Error updating proposal template:", error)
    throw error
  }
}

// Soft delete a proposal template
export async function deleteProposalTemplate(templateId: string): Promise<void> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const templateRef = doc(db, "proposal_templates", templateId)
    await updateDoc(templateRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error deleting proposal template:", error)
    throw error
  }
}
