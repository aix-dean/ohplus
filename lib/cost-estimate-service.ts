import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
} from "firebase/firestore"
import type { CostEstimate, CostEstimateStatus, CostEstimateLineItem } from "@/lib/types/cost-estimate"
import type { Proposal } from "@/lib/types/proposal"

const COST_ESTIMATES_COLLECTION = "cost_estimates"

interface CreateCostEstimateOptions {
  notes?: string
  customMessage?: string
  sendEmail?: boolean
  startDate?: Date // New field
  endDate?: Date // New field
}

interface CostEstimateClientData {
  id: string
  name: string
  email: string
  company: string
  phone?: string
  address?: string
  designation?: string
  industry?: string // Ensure industry is included here
}

interface CostEstimateSiteData {
  id: string
  name: string
  location: string
  price: number
  type: string
}

// Helper function to get Firestore instance, handling client/server environments
async function getDbInstance(): Promise<any> {
  // This function is not needed after the updates as db is imported directly
  return db
}

// Generate a secure password for cost estimate access
function generateCostEstimatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Create a new cost estimate from a proposal
export async function createCostEstimateFromProposal(
  proposal: Proposal,
  userId: string,
  options?: CreateCostEstimateOptions,
): Promise<string> {
  try {
    const lineItems: CostEstimateLineItem[] = []
    let totalAmount = 0

    // Add line items for each product in the proposal
    proposal.products.forEach((product) => {
      const price = typeof product.price === "number" ? product.price : 0
      lineItems.push({
        id: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: price,
        total: price,
        category: product.type === "LED" ? "LED Billboard Rental" : "Static Billboard Rental", // Categorize based on type
        notes: `Location: ${product.location}`,
      })
      totalAmount += price
    })

    // Add default cost categories (can be customized later)
    lineItems.push({
      id: "production-cost",
      description: "Production Cost (Tarpaulin/LED Content)",
      quantity: 1,
      unitPrice: 0, // To be filled by user
      total: 0,
      category: "Production",
      notes: "Estimated cost for content production.",
    })
    lineItems.push({
      id: "installation-cost",
      description: "Installation/Dismantling Fees",
      quantity: 1,
      unitPrice: 0, // To be filled by user
      total: 0,
      category: "Installation",
      notes: "Estimated cost for installation and dismantling.",
    })
    lineItems.push({
      id: "maintenance-cost",
      description: "Maintenance & Monitoring",
      quantity: 1,
      unitPrice: 0, // To be filled by user
      total: 0,
      category: "Maintenance",
      notes: "Estimated cost for ongoing maintenance and monitoring.",
    })

    const costEstimateNumber = `CE${Date.now()}` // Generate CE + currentmillis

    const newCostEstimateRef = await addDoc(collection(db, COST_ESTIMATES_COLLECTION), {
      proposalId: proposal.id,
      costEstimateNumber: costEstimateNumber, // Store the new number
      title: `Cost Estimate for ${proposal.title}`,
      client: proposal.client,
      lineItems,
      totalAmount,
      status: "draft",
      notes: options?.notes || "",
      customMessage: options?.customMessage || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      startDate: options?.startDate || null, // Store new dates
      endDate: options?.endDate || null, // Store new dates
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set valid for 30 days
    })

    return newCostEstimateRef.id
  } catch (error) {
    console.error("Error creating cost estimate from proposal:", error)
    throw new Error("Failed to create cost estimate from proposal.")
  }
}

// Create a cost estimate directly without a proposal
export async function createDirectCostEstimate(
  clientData: CostEstimateClientData,
  sitesData: CostEstimateSiteData[],
  userId: string,
  options?: CreateCostEstimateOptions,
): Promise<string> {
  try {
    const lineItems: CostEstimateLineItem[] = []
    let totalAmount = 0

    // Add line items for each selected site
    sitesData.forEach((site) => {
      lineItems.push({
        id: site.id,
        description: site.name,
        quantity: 1,
        unitPrice: site.price,
        total: site.price,
        category: site.type === "LED" ? "LED Billboard Rental" : "Static Billboard Rental",
        notes: `Location: ${site.location}`,
      })
      totalAmount += site.price
    })

    // Add default cost categories
    lineItems.push({
      id: "production-cost",
      description: "Production Cost (Tarpaulin/LED Content)",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      category: "Production",
      notes: "Estimated cost for content production.",
    })
    lineItems.push({
      id: "installation-cost",
      description: "Installation/Dismantling Fees",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      category: "Installation",
      notes: "Estimated cost for installation and dismantling.",
    })
    lineItems.push({
      id: "maintenance-cost",
      description: "Maintenance & Monitoring",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      category: "Maintenance",
      notes: "Estimated cost for ongoing maintenance and monitoring.",
    })

    const costEstimateNumber = `CE${Date.now()}` // Generate CE + currentmillis

    const newCostEstimateRef = await addDoc(collection(db, COST_ESTIMATES_COLLECTION), {
      proposalId: null, // No associated proposal
      costEstimateNumber: costEstimateNumber, // Store the new number
      title: `Cost Estimate for ${clientData.company || clientData.name}`,
      client: {
        id: clientData.id,
        name: clientData.name,
        email: clientData.email,
        company: clientData.company,
        phone: clientData.phone || "",
        address: clientData.address || "",
        designation: clientData.designation || "",
        industry: clientData.industry || "", // Ensure industry is included here
      },
      lineItems,
      totalAmount,
      status: "draft",
      notes: options?.notes || "",
      customMessage: options?.customMessage || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      startDate: options?.startDate || null, // Store new dates
      endDate: options?.endDate || null, // Store new dates
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set valid for 30 days
    })

    return newCostEstimateRef.id
  } catch (error) {
    console.error("Error creating direct cost estimate:", error)
    throw new Error("Failed to create direct cost estimate.")
  }
}

// Send cost estimate email
export async function sendCostEstimateEmail(
  costEstimate: any,
  clientEmail: string,
  client: any,
  currentUserEmail?: string, // New: current user's email for reply-to
  ccEmail?: string, // New: CC email
): Promise<void> {
  try {
    console.log("Sending cost estimate email to:", clientEmail)

    const response = await fetch("/api/cost-estimates/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        costEstimate,
        clientEmail,
        client,
        currentUserEmail, // Pass current user's email
        ccEmail, // Pass CC email
      }),
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.details || errorMessage
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError)
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || result.details || "Email sending failed")
    }

    console.log("Cost estimate email sent successfully:", result)
  } catch (error) {
    console.error("Error sending cost estimate email:", error)
    throw error
  }
}

// Get cost estimates by proposal ID
export async function getCostEstimatesByProposalId(proposalId: string): Promise<CostEstimate[]> {
  try {
    const q = query(
      collection(db, COST_ESTIMATES_COLLECTION),
      where("proposalId", "==", proposalId),
      orderBy("createdAt", "desc"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        proposalId: data.proposalId || null,
        costEstimateNumber: data.costEstimateNumber || null, // Retrieve new number
        title: data.title,
        client: data.client,
        lineItems: data.lineItems,
        totalAmount: data.totalAmount,
        status: data.status,
        notes: data.notes || "",
        customMessage: data.customMessage || "",
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        createdBy: data.createdBy,
        startDate: data.startDate?.toDate() || null, // Retrieve new dates
        endDate: data.endDate?.toDate() || null, // Retrieve new dates
        validUntil: data.validUntil?.toDate() || null, // Retrieve new dates
      } as CostEstimate
    })
  } catch (error) {
    console.error("Error fetching cost estimates:", error)
    return []
  }
}

// Get a single cost estimate by ID
export async function getCostEstimate(id: string): Promise<CostEstimate | null> {
  try {
    const docRef = doc(db, COST_ESTIMATES_COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      proposalId: data.proposalId || null,
      costEstimateNumber: data.costEstimateNumber || null, // Retrieve new number
      title: data.title,
      client: data.client,
      lineItems: data.lineItems,
      totalAmount: data.totalAmount,
      status: data.status,
      notes: data.notes || "",
      customMessage: data.customMessage || "",
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      createdBy: data.createdBy,
      startDate: data.startDate?.toDate() || null, // Retrieve new dates
      endDate: data.endDate?.toDate() || null, // Retrieve new dates
      validUntil: data.validUntil?.toDate() || null, // Retrieve new dates
    } as CostEstimate
  } catch (error) {
    console.error("Error fetching cost estimate:", error)
    throw new Error("Failed to fetch cost estimate.")
  }
}

// Update cost estimate status
export async function updateCostEstimateStatus(id: string, status: CostEstimateStatus): Promise<void> {
  try {
    const docRef = doc(db, COST_ESTIMATES_COLLECTION, id)
    await updateDoc(docRef, {
      status: status,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating cost estimate status:", error)
    throw new Error("Failed to update cost estimate status.")
  }
}

// Update cost estimate
export async function updateCostEstimate(costEstimateId: string, updates: Partial<CostEstimate>): Promise<void> {
  try {
    const costEstimateRef = doc(db, COST_ESTIMATES_COLLECTION, costEstimateId)
    await updateDoc(costEstimateRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating cost estimate:", error)
    throw error
  }
}

// Get all cost estimates
export async function getAllCostEstimates(): Promise<CostEstimate[]> {
  try {
    const q = query(collection(db, COST_ESTIMATES_COLLECTION), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        proposalId: data.proposalId || null,
        costEstimateNumber: data.costEstimateNumber || null, // Retrieve new number
        title: data.title,
        client: data.client,
        lineItems: data.lineItems,
        totalAmount: data.totalAmount,
        status: data.status,
        notes: data.notes || "",
        customMessage: data.customMessage || "",
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        createdBy: data.createdBy,
        startDate: data.startDate?.toDate() || null, // Retrieve new dates
        endDate: data.endDate?.toDate() || null, // Retrieve new dates
        validUntil: data.validUntil?.toDate() || null, // Retrieve new dates
      } as CostEstimate
    })
  } catch (error) {
    console.error("Error getting all cost estimates:", error)
    throw new Error("Failed to retrieve all cost estimates.")
  }
}

// Get paginated cost estimates
export async function getPaginatedCostEstimates(
  limitCount: number,
  lastDocId: string | null,
  searchQuery = "",
): Promise<{ items: CostEstimate[]; lastVisible: string | null }> {
  try {
    let q = query(collection(db, COST_ESTIMATES_COLLECTION), orderBy("createdAt", "desc"))

    if (searchQuery) {
      const lowerCaseSearchQuery = searchQuery.toLowerCase()
      q = query(
        collection(db, COST_ESTIMATES_COLLECTION),
        where("title", ">=", lowerCaseSearchQuery),
        where("title", "<=", lowerCaseSearchQuery + "\uf8ff"),
        orderBy("title"),
      )
    } else {
      q = query(collection(db, COST_ESTIMATES_COLLECTION), orderBy("createdAt", "desc"))
    }

    if (lastDocId) {
      const lastDoc = await getDoc(doc(db, COST_ESTIMATES_COLLECTION, lastDocId))
      if (lastDoc.exists()) {
        q = query(q, startAfter(lastDoc))
      }
    }

    q = query(q, limit(limitCount))

    const querySnapshot = await getDocs(q)
    const items: CostEstimate[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        proposalId: data.proposalId || null,
        costEstimateNumber: data.costEstimateNumber || null, // Retrieve new number
        title: data.title,
        client: data.client,
        lineItems: data.lineItems,
        totalAmount: data.totalAmount,
        status: data.status,
        notes: data.notes || "",
        customMessage: data.customMessage || "",
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        createdBy: data.createdBy,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        validUntil: data.validUntil?.toDate() || null,
      } as CostEstimate
    })

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
    const newLastDocId = lastVisibleDoc ? lastVisibleDoc.id : null

    return { items, lastVisible: newLastDocId }
  } catch (error) {
    console.error("Error fetching paginated cost estimates:", error)
    throw new Error("Failed to fetch paginated cost estimates.")
  }
}

// Delete cost estimate
export async function deleteCostEstimate(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COST_ESTIMATES_COLLECTION, id))
  } catch (error) {
    console.error("Error deleting cost estimate:", error)
    throw new Error("Failed to delete cost estimate.")
  }
}

// Get cost estimates by createdBy ID
export async function getCostEstimatesByCreatedBy(userId: string): Promise<CostEstimate[]> {
  try {
    const q = query(
      collection(db, COST_ESTIMATES_COLLECTION),
      where("createdBy", "==", userId),
      orderBy("createdAt", "desc"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        proposalId: data.proposalId || null,
        costEstimateNumber: data.costEstimateNumber || null, // Retrieve new number
        title: data.title,
        client: data.client,
        lineItems: data.lineItems,
        totalAmount: data.totalAmount,
        status: data.status,
        notes: data.notes || "",
        customMessage: data.customMessage || "",
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        createdBy: data.createdBy,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        validUntil: data.validUntil?.toDate() || null,
      } as CostEstimate
    })
  } catch (error) {
    console.error("Error fetching cost estimates by createdBy ID:", error)
    return []
  }
}
