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
  startDate?: Date | undefined // Made startDate and endDate optional and allow undefined
  endDate?: Date | undefined
  customLineItems?: CostEstimateLineItem[] // Allow passing custom line items
  company_id?: string
  page_id?: string
  client_company_id?: string // Added client_company_id field
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
  image?: string // Added image field for product images
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

// Calculate duration in days
function calculateDurationDays(startDate: Date | null | undefined, endDate: Date | null | undefined): number | null {
  if (startDate && endDate) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  return null
}

// Create a new cost estimate from a proposal
export async function createCostEstimateFromProposal(
  proposal: Proposal,
  userId: string,
  options?: CreateCostEstimateOptions,
): Promise<string> {
  try {
    const durationDays = calculateDurationDays(options?.startDate || null, options?.endDate || null)
    let totalAmount = 0
    const lineItems: CostEstimateLineItem[] = options?.customLineItems || []

    // If customLineItems are not provided, generate them from proposal products
    if (!options?.customLineItems || options.customLineItems.length === 0) {
      proposal.products.forEach((product) => {
        const pricePerDay = (typeof product.price === "number" ? product.price : 0) / 30
        const calculatedTotalPrice = durationDays ? pricePerDay * durationDays : product.price // Use original price if no duration
        lineItems.push({
          id: product.id,
          description: product.name,
          quantity: 1,
          unitPrice: product.price, // Keep original unit price for reference
          total: calculatedTotalPrice,
          category: product.type === "LED" ? "LED Billboard Rental" : "Static Billboard Rental",
          notes: `Location: ${product.location}`,
        })
      })

      // Add default cost categories if not using custom line items
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
    }

    // Recalculate total amount based on final line items
    totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0)

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
      company_id: options?.company_id || "",
      page_id: options?.page_id || "",
      startDate: options?.startDate || null, // Store new dates
      endDate: options?.endDate || null, // Store new dates
      durationDays: durationDays, // Store duration in days
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
    const durationDays = calculateDurationDays(options?.startDate || null, options?.endDate || null)
    let totalAmount = 0
    const lineItems: CostEstimateLineItem[] = options?.customLineItems || []

    // If customLineItems are not provided, generate them from sitesData
    if (!options?.customLineItems || options.customLineItems.length === 0) {
      sitesData.forEach((site) => {
        const pricePerDay = site.price / 30
        const calculatedTotalPrice = durationDays ? pricePerDay * durationDays : site.price
        lineItems.push({
          id: site.id,
          description: site.name,
          quantity: 1,
          unitPrice: site.price, // Keep original unit price for reference
          total: calculatedTotalPrice,
          category: site.type === "LED" ? "LED Billboard Rental" : "Static Billboard Rental",
          notes: `Location: ${site.location}`,
          image: site.image || undefined, // Added image field to line items
        })
      })
    }

    // Recalculate total amount based on final line items
    totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0)

    const costEstimateNumber = `CE${Date.now()}` // Generate CE + currentmillis

    const pageId = options?.page_id || `PAGE-${Date.now()}`
    const companyId = options?.company_id || ""

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
        industry: clientData.industry || "",
        company_id: options?.client_company_id || "", // Added client_company_id to client object
      },
      lineItems,
      totalAmount,
      status: "draft",
      notes: options?.notes || "",
      customMessage: options?.customMessage || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      company_id: companyId,
      page_id: pageId,
      page_number: 1, // Added page_number field for single documents
      startDate: options?.startDate || null,
      endDate: options?.endDate || null,
      durationDays: durationDays,
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
        costEstimateNumber: data.costEstimateNumber || null,
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
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        durationDays: data.durationDays || null,
        validUntil: data.validUntil?.toDate() || null,
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
      costEstimateNumber: data.costEstimateNumber || null,
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
      company_id: data.company_id || "",
      page_id: data.page_id || "",
      page_number: data.page_number || 1,
      startDate: data.startDate?.toDate() || null,
      endDate: data.endDate?.toDate() || null,
      durationDays: data.durationDays || null,
      validUntil: data.validUntil?.toDate() || null,
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
        costEstimateNumber: data.costEstimateNumber || null,
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
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        durationDays: data.durationDays || null,
        validUntil: data.validUntil?.toDate() || null,
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
        costEstimateNumber: data.costEstimateNumber || null,
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
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        durationDays: data.durationDays || null,
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
        costEstimateNumber: data.costEstimateNumber || null,
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
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        durationDays: data.durationDays || null,
        validUntil: data.validUntil?.toDate() || null,
      } as CostEstimate
    })
  } catch (error) {
    console.error("Error fetching cost estimates by createdBy ID:", error)
    return []
  }
}

// Create multiple cost estimates for multiple sites
export async function createMultipleCostEstimates(
  clientData: CostEstimateClientData,
  sitesData: CostEstimateSiteData[],
  userId: string,
  options?: CreateCostEstimateOptions,
): Promise<string[]> {
  try {
    const costEstimateIds: string[] = []

    const pageId = options?.page_id || `PAGE-${Date.now()}`
    const companyId = options?.company_id || ""

    // Create a separate cost estimate for each site
    for (let i = 0; i < sitesData.length; i++) {
      const site = sitesData[i]
      const durationDays = calculateDurationDays(options?.startDate || null, options?.endDate || null)
      let totalAmount = 0
      const lineItems: CostEstimateLineItem[] = []

      // Create line item for this specific site
      const pricePerDay = site.price / 30
      const calculatedTotalPrice = durationDays ? pricePerDay * durationDays : site.price
      lineItems.push({
        id: site.id,
        description: site.name,
        quantity: 1,
        unitPrice: site.price, // Keep original unit price for reference
        total: calculatedTotalPrice,
        category: site.type === "LED" ? "LED Billboard Rental" : "Static Billboard Rental",
        notes: `Location: ${site.location}`,
        image: site.image || undefined, // Added image field to line items for multiple cost estimates
      })

      // Calculate total amount for this site
      totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0)

      const costEstimateNumber = `CE${Date.now()}-${site.id.slice(-4)}` // Generate unique CE number for each site

      const newCostEstimateRef = await addDoc(collection(db, COST_ESTIMATES_COLLECTION), {
        proposalId: null, // No associated proposal
        costEstimateNumber: costEstimateNumber,
        title: `Cost Estimate for ${site.name} - ${clientData.company || clientData.name}`,
        client: {
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          company: clientData.company,
          phone: clientData.phone || "",
          address: clientData.address || "",
          designation: clientData.designation || "",
          industry: clientData.industry || "",
          company_id: options?.client_company_id || "", // Added client_company_id to client object
        },
        lineItems,
        totalAmount,
        status: "draft",
        notes: options?.notes || "",
        customMessage: options?.customMessage || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        company_id: companyId, // Use the provided company_id
        page_id: pageId, // Use the same page_id for all documents
        page_number: i + 1, // Add sequential page numbers (1, 2, 3, etc.)
        startDate: options?.startDate || null,
        endDate: options?.endDate || null,
        durationDays: durationDays,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set valid for 30 days
      })

      costEstimateIds.push(newCostEstimateRef.id)
    }

    return costEstimateIds
  } catch (error) {
    console.error("Error creating multiple cost estimates:", error)
    throw new Error("Failed to create multiple cost estimates.")
  }
}

// Get cost estimates by page_id for pagination
export async function getCostEstimatesByPageId(pageId: string): Promise<CostEstimate[]> {
  try {
    const q = query(
      collection(db, COST_ESTIMATES_COLLECTION),
      where("page_id", "==", pageId),
      orderBy("page_number", "asc"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        proposalId: data.proposalId || null,
        costEstimateNumber: data.costEstimateNumber || null,
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
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        durationDays: data.durationDays || null,
        validUntil: data.validUntil?.toDate() || null,
      } as CostEstimate
    })
  } catch (error) {
    console.error("Error fetching cost estimates by page_id:", error)
    return []
  }
}

// Get cost estimates by client ID for history sidebar
export async function getCostEstimatesByClientId(clientId: string): Promise<CostEstimate[]> {
  try {
    const q = query(
      collection(db, COST_ESTIMATES_COLLECTION),
      where("client.id", "==", clientId),
      orderBy("createdAt", "desc"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        proposalId: data.proposalId || null,
        costEstimateNumber: data.costEstimateNumber || null,
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
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        durationDays: data.durationDays || null,
        validUntil: data.validUntil?.toDate() || null,
      } as CostEstimate
    })
  } catch (error) {
    console.error("Error fetching cost estimates by client ID:", error)
    return []
  }
}

export async function getCostEstimatesByLineItemIds(lineItemIds: string[]): Promise<CostEstimate[]> {
  try {
    if (lineItemIds.length === 0) {
      return []
    }

    const q = query(collection(db, COST_ESTIMATES_COLLECTION), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    const allCostEstimates: CostEstimate[] = []
    const uniqueLineItemIds = new Set(lineItemIds)

    querySnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      const costEstimate = {
        id: docSnap.id,
        proposalId: data.proposalId || null,
        costEstimateNumber: data.costEstimateNumber || null,
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
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: data.startDate?.toDate() || null,
        endDate: data.endDate?.toDate() || null,
        durationDays: data.durationDays || null,
        validUntil: data.validUntil?.toDate() || null,
      } as CostEstimate

      // Check if any of the cost estimate's line items match the provided lineItemIds
      const hasMatchingLineItem = costEstimate.lineItems.some((item: CostEstimateLineItem) =>
        uniqueLineItemIds.has(item.id),
      )

      if (hasMatchingLineItem) {
        allCostEstimates.push(costEstimate)
      }
    })

    return allCostEstimates
  } catch (error) {
    console.error("Error fetching cost estimates by line item IDs:", error)
    return []
  }
}
