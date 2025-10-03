import { db } from "@/lib/firebase"
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service"
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
  Timestamp,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
} from "firebase/firestore"
import type { CostEstimate, CostEstimateStatus, CostEstimateLineItem } from "@/lib/types/cost-estimate"
import type { Proposal } from "@/lib/types/proposal"
import { calculateProratedPrice } from "@/lib/quotation-service"

// Algolia client for indexing
let algoliasearch: any = null
let costEstimatesIndex: any = null

// Initialize Algolia client
function initializeAlgolia() {
  if (typeof window === 'undefined') {
    // Server-side
    try {
      algoliasearch = require('algoliasearch')
      const client = algoliasearch(
        process.env.NEXT_PUBLIC_ALGOLIA_COST_ESTIMATES_APP_ID,
        process.env.ALGOLIA_COST_ESTIMATES_ADMIN_API_KEY
      )
      costEstimatesIndex = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_COST_ESTIMATES_INDEX_NAME)
    } catch (error) {
      console.warn('Algolia client not available:', error)
    }
  }
}

// Index cost estimate in Algolia
async function indexCostEstimate(costEstimate: CostEstimate) {
  if (!costEstimatesIndex) {
    initializeAlgolia()
  }

  if (!costEstimatesIndex) {
    console.warn('Algolia index not available, skipping indexing')
    return
  }

  try {
    const algoliaObject = {
      objectID: costEstimate.id,
      id: costEstimate.id,
      title: costEstimate.title,
      client_company: costEstimate.client?.company || '',
      client_contact: costEstimate.client?.contactPerson || '',
      client_email: costEstimate.client?.email || '',
      client_phone: costEstimate.client?.phone || '',
      status: costEstimate.status,
      totalAmount: costEstimate.totalAmount,
      createdAt: costEstimate.createdAt?.toISOString() || '',
      company_id: costEstimate.company_id,
      lineItems: costEstimate.lineItems || [],
      lineItemsCount: costEstimate.lineItems?.length || 0,
    }

    await costEstimatesIndex.saveObject(algoliaObject)
    console.log('Cost estimate indexed in Algolia:', costEstimate.id)
  } catch (error) {
    console.error('Error indexing cost estimate in Algolia:', error)
  }
}

// Remove cost estimate from Algolia index
async function removeCostEstimateFromIndex(costEstimateId: string) {
  if (!costEstimatesIndex) {
    initializeAlgolia()
  }

  if (!costEstimatesIndex) {
    console.warn('Algolia index not available, skipping removal')
    return
  }

  try {
    await costEstimatesIndex.deleteObject(costEstimateId)
    console.log('Cost estimate removed from Algolia index:', costEstimateId)
  } catch (error) {
    console.error('Error removing cost estimate from Algolia index:', error)
  }
}

const COST_ESTIMATES_COLLECTION = "cost_estimates"

// Helper function to safely convert to Date
function safeToDate(dateValue: any): Date | null {
  if (!dateValue) return null
  if (dateValue instanceof Date) return dateValue
  if (dateValue.toDate && typeof dateValue.toDate === "function") return dateValue.toDate()
  return new Date(dateValue)
}

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
  specs_rental?: any // Added specs_rental field to match quotation structure
}

// Generate an 8-digit password for cost estimate PDF access
function generateCostEstimatePassword(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

// Calculate duration in days
function calculateDurationDays(startDate: Date | null | undefined, endDate: Date | null | undefined): number | null {
  if (startDate && endDate) {
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
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
        let calculatedTotalPrice = typeof product.price === "number" ? product.price : 0
        if (options?.startDate && options?.endDate) {
          // Use prorated calculation when dates are provided
          calculatedTotalPrice = calculateProratedPrice(typeof product.price === "number" ? product.price : 0, options.startDate, options.endDate)
        } else if (durationDays) {
          // Fallback to simple calculation if duration is provided but no dates
          const pricePerDay = (typeof product.price === "number" ? product.price : 0) / 30
          calculatedTotalPrice = pricePerDay * durationDays
        }
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

    // Index the cost estimate in Algolia
    const costEstimateData = {
      id: newCostEstimateRef.id,
      proposalId: proposal.id,
      costEstimateNumber: costEstimateNumber,
      title: `Cost Estimate for ${proposal.title}`,
      client: proposal.client,
      lineItems,
      totalAmount,
      status: "draft",
      notes: options?.notes || "",
      customMessage: options?.customMessage || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      company_id: options?.company_id || "",
      page_id: options?.page_id || "",
      startDate: options?.startDate || null,
      endDate: options?.endDate || null,
      durationDays: durationDays,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    } as CostEstimate

    // Index asynchronously (don't await to avoid blocking)
    indexCostEstimate(costEstimateData)

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
        let calculatedTotalPrice = site.price || 0
        if (options?.startDate && options?.endDate) {
          // Use prorated calculation when dates are provided
          calculatedTotalPrice = calculateProratedPrice(site.price || 0, options.startDate, options.endDate)
        } else if (durationDays) {
          // Fallback to simple calculation if duration is provided but no dates
          const pricePerDay = (site.price || 0) / 30
          calculatedTotalPrice = pricePerDay * durationDays
        }
        lineItems.push({
          id: site.id,
          description: site.name,
          quantity: 1,
          unitPrice: site.price, // Keep original unit price for reference
          total: calculatedTotalPrice,
          category: site.type === "LED" ? "LED Billboard Rental" : "Static Billboard Rental",
          notes: `Location: ${site.location}`,
          image: site.image || undefined, // Added image field to line items
          content_type: site.type || "", // Added content_type field to match quotation structure
          specs: site.specs_rental, // Added specs field to match quotation structure
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        createdBy: data.createdBy,
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        durationDays: data.durationDays || null,
        validUntil: safeToDate(data.validUntil),
        signature_position: data.signature_position || undefined,
        items: data.items || undefined,
        template: data.template || undefined,
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
      createdAt: safeToDate(data.createdAt),
      updatedAt: safeToDate(data.updatedAt),
      createdBy: data.createdBy,
      company_id: data.company_id || "",
      page_id: data.page_id || "",
      page_number: data.page_number || 1,
      startDate: safeToDate(data.startDate),
      endDate: safeToDate(data.endDate),
      durationDays: data.durationDays || null,
      validUntil: safeToDate(data.validUntil),
      signature_position: data.signature_position || undefined,
      items: data.items || undefined,
      template: data.template || undefined,
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
    // Exclude createdAt and validUntil from updates to prevent them from being modified during edits
    const { createdAt, validUntil, ...allowedUpdates } = updates

    // Ensure date fields are properly stored as Timestamps
    const processedUpdates: any = { ...allowedUpdates }
    if (processedUpdates.startDate instanceof Date) {
      processedUpdates.startDate = Timestamp.fromDate(processedUpdates.startDate)
    }
    if (processedUpdates.endDate instanceof Date) {
      processedUpdates.endDate = Timestamp.fromDate(processedUpdates.endDate)
    }

    if (processedUpdates.pdf !== undefined) processedUpdates.pdf = processedUpdates.pdf
    if (processedUpdates.password !== undefined) processedUpdates.password = processedUpdates.password

    const costEstimateRef = doc(db, COST_ESTIMATES_COLLECTION, costEstimateId)
    await updateDoc(costEstimateRef, {
      ...processedUpdates,
      updatedAt: serverTimestamp(),
    })

    // Re-index the updated cost estimate in Algolia
    try {
      const updatedDoc = await getDoc(costEstimateRef)
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data()
        const updatedCostEstimate = {
          id: costEstimateId,
          proposalId: updatedData.proposalId || null,
          costEstimateNumber: updatedData.costEstimateNumber || null,
          title: updatedData.title,
          client: updatedData.client,
          lineItems: updatedData.lineItems,
          totalAmount: updatedData.totalAmount,
          status: updatedData.status,
          notes: updatedData.notes || "",
          customMessage: updatedData.customMessage || "",
          createdAt: safeToDate(updatedData.createdAt),
          updatedAt: new Date(),
          createdBy: updatedData.createdBy,
          company_id: updatedData.company_id || "",
          page_id: updatedData.page_id || "",
          startDate: safeToDate(updatedData.startDate),
          endDate: safeToDate(updatedData.endDate),
          durationDays: updatedData.durationDays || null,
          validUntil: safeToDate(updatedData.validUntil),
        } as CostEstimate

        // Re-index asynchronously
        indexCostEstimate(updatedCostEstimate)
      }
    } catch (indexError) {
      console.error('Error re-indexing updated cost estimate:', indexError)
    }
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        createdBy: data.createdBy,
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        durationDays: data.durationDays || null,
        validUntil: safeToDate(data.validUntil),
        signature_position: data.signature_position || undefined,
        items: data.items || undefined,
        template: data.template || undefined,
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        createdBy: data.createdBy,
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        durationDays: data.durationDays || null,
        validUntil: safeToDate(data.validUntil),
        signature_position: data.signature_position || undefined,
        items: data.items || undefined,
        template: data.template || undefined,
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

    // Remove from Algolia index
    removeCostEstimateFromIndex(id)
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        createdBy: data.createdBy,
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        durationDays: data.durationDays || null,
        validUntil: safeToDate(data.validUntil),
        signature_position: data.signature_position || undefined,
        items: data.items || undefined,
        template: data.template || undefined,
      } as CostEstimate
    })
  } catch (error) {
    console.error("Error fetching cost estimates by createdBy ID:", error)
    return []
  }
}

// Get paginated cost estimates by createdBy ID
export async function getPaginatedCostEstimatesByCreatedBy(
  companyId: string,
  limitCount: number,
  lastDocId: string | null = null,
): Promise<{ items: CostEstimate[]; lastVisible: string | null; hasMore: boolean }> {
  try {
    let q = query(
      collection(db, COST_ESTIMATES_COLLECTION),
      where("company_id", "==", companyId),
      orderBy("createdAt", "desc"),
      limit(limitCount + 1) // Fetch one extra to check if there are more pages
    )

    if (lastDocId) {
      const lastDoc = await getDoc(doc(db, COST_ESTIMATES_COLLECTION, lastDocId))
      if (lastDoc.exists()) {
        q = query(q, startAfter(lastDoc))
      }
    }

    const querySnapshot = await getDocs(q)
    const items: CostEstimate[] = querySnapshot.docs.slice(0, limitCount).map((docSnap) => {
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        createdBy: data.createdBy,
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        durationDays: data.durationDays || null,
        validUntil: safeToDate(data.validUntil),
      } as CostEstimate
    })

    const hasMore = querySnapshot.docs.length > limitCount
    const lastVisibleDoc = querySnapshot.docs[limitCount - 1]
    const newLastDocId = lastVisibleDoc ? lastVisibleDoc.id : null

    return { items, lastVisible: newLastDocId, hasMore }
  } catch (error) {
    console.error("Error fetching paginated cost estimates by createdBy ID:", error)
    return { items: [], lastVisible: null, hasMore: false }
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
      let calculatedTotalPrice = site.price || 0
      if (options?.startDate && options?.endDate) {
        // Use prorated calculation when dates are provided
        calculatedTotalPrice = calculateProratedPrice(site.price || 0, options.startDate, options.endDate)
      } else if (durationDays) {
        // Fallback to simple calculation if duration is provided but no dates
        const pricePerDay = (site.price || 0) / 30
        calculatedTotalPrice = pricePerDay * durationDays
      }
      lineItems.push({
        id: site.id,
        description: site.name,
        quantity: 1,
        unitPrice: site.price, // Keep original unit price for reference
        total: calculatedTotalPrice,
        category: site.type === "LED" ? "LED Billboard Rental" : "Static Billboard Rental",
        notes: `Location: ${site.location}`,
        image: site.image || undefined, // Added image field to line items for multiple cost estimates
        specs: site.specs_rental, // Added specs field to match quotation structure
        content_type: site.type || "", // Added content_type field to match quotation structure
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
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        createdBy: data.createdBy,
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        durationDays: data.durationDays || null,
        validUntil: safeToDate(data.validUntil),
        signature_position: data.signature_position || undefined,
        items: data.items || undefined,
        template: data.template || undefined,
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
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        durationDays: data.durationDays || null,
        validUntil: safeToDate(data.validUntil),
      } as CostEstimate
    })
  } catch (error) {
    console.error("Error fetching cost estimates by client ID:", error)
    return []
  }
}

// Get cost estimates by product ID and company ID for history sidebar
export async function getCostEstimatesByProductIdAndCompanyId(productId: string, companyId: string, excludeId?: string): Promise<CostEstimate[]> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const costEstimatesRef = collection(db, COST_ESTIMATES_COLLECTION)
    const q = query(costEstimatesRef, orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const costEstimates: CostEstimate[] = []

    querySnapshot.forEach((doc) => {
      // Skip the excluded cost estimate if specified
      if (excludeId && doc.id === excludeId) {
        return
      }

      const data = doc.data()
      const costEstimate = {
        id: doc.id,
        proposalId: data.proposalId || null,
        costEstimateNumber: data.costEstimateNumber || null,
        title: data.title,
        client: data.client,
        lineItems: data.lineItems || [],
        totalAmount: data.totalAmount,
        status: data.status,
        notes: data.notes || "",
        customMessage: data.customMessage || "",
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        createdBy: data.createdBy,
        company_id: data.company_id || "",
        page_id: data.page_id || "",
        page_number: data.page_number || 1,
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate),
        durationDays: data.durationDays || null,
        validUntil: safeToDate(data.validUntil),
      } as CostEstimate

      // Check if the cost estimate matches the product ID and company ID
      const hasMatchingProduct = costEstimate.lineItems.some((item) => item.id === productId)
      const hasMatchingCompany = costEstimate.company_id === companyId

      if (hasMatchingProduct && hasMatchingCompany) {
        costEstimates.push(costEstimate)
      }
    })

    return costEstimates
  } catch (error) {
    console.error("Error fetching cost estimates by product ID and company ID:", error)
    return []
  }
}

// Generate PDF and upload to Firebase storage with password protection
export async function generateAndUploadCostEstimatePDF(
  costEstimate: CostEstimate,
  userData?: { first_name?: string; last_name?: string; email?: string; company_id?: string }
): Promise<{ pdfUrl: string; password: string }> {
  try {
    // Generate the PDF blob using the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-cost-estimate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        costEstimate,
        companyData: null,
        logoDataUrl: null,
        format: 'pdf',
        userData
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    const blob = new Blob([buffer], { type: 'application/pdf' })

    // Generate password
    const password = generateCostEstimatePassword()

    // Create a unique filename
    const timestamp = Date.now()
    const filename = `cost-estimate_${costEstimate.id}_${timestamp}.pdf`

    // Convert blob to File object for upload
    const pdfFile = new File([blob], filename, { type: 'application/pdf' })

    // Upload to Firebase storage
    const uploadPath = `cost-estimates/pdfs/${filename}`
    const pdfUrl = await uploadFileToFirebaseStorage(pdfFile, uploadPath)

    return { pdfUrl, password }
  } catch (error) {
    console.error("Error generating and uploading cost estimate PDF:", error)
    throw error
  }
}
