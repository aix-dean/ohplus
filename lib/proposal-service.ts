import {
  updateCampaignStatus,
  getCampaignByProposalId,
  createCampaignFromProposal,
  addCampaignTimelineEvent,
} from "@/lib/campaign-service"
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
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Proposal, ProposalProduct, ProposalClient } from "@/lib/types/proposal"
import { logProposalCreated, logProposalStatusChanged, logProposalEmailSent } from "@/lib/proposal-activity-service"

// Removed generateProposalPassword function

// Create a new proposal
export async function createProposal(
  title: string,
  client: ProposalClient,
  products: ProposalProduct[],
  userId: string,
  options: {
    notes?: string
    customMessage?: string
    validUntil?: Date
    // Removed sendEmail option
    campaignId?: string // Add optional campaign ID parameter
    companyId?: string // Add optional company ID parameter
    client_company_id?: string // Add client_company_id parameter
  } = {},
): Promise<string> {
  try {
    const totalAmount = products.reduce((sum, product) => {
      const price = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price
      return sum + (isNaN(price) ? 0 : price)
    }, 0)

    // Clean the client data to ensure no undefined values
    const cleanClient: ProposalClient = {
      id: client.id || "", // Include id field
      company: client.company || "",
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      industry: client.industry || "",
      targetAudience: client.targetAudience || "",
      campaignObjective: client.campaignObjective || "",
      designation: client.designation || "", // Include designation
      company_id: options.client_company_id || "", // Add client_company_id to client field map
    }

    // Clean the products data to ensure no undefined values
    const cleanProducts: ProposalProduct[] = products.map((product) => ({
      id: product.id,
      name: product.name || "",
      type: product.type || "",
      price: typeof product.price === "string" ? Number.parseFloat(product.price) || 0 : product.price || 0,
      location: product.location || "",
      site_code: product.site_code || "",
      media: product.media || [],
      specs_rental: product.specs_rental
        ? {
            location: product.specs_rental.location || "",
            traffic_count: product.specs_rental.traffic_count || 0,
            elevation: product.specs_rental.elevation || 0,
            height: product.specs_rental.height || 0,
            width: product.specs_rental.width || 0,
            audience_type: product.specs_rental.audience_type || "",
            audience_types: product.specs_rental.audience_types || [],
          }
        : null,
      light: product.light
        ? {
            location: product.light.location || "",
            name: product.light.name || "",
            operator: product.light.operator || "",
          }
        : null,
      description: product.description || "",
      health_percentage: product.health_percentage || 0,
    }))

    // Generate proposal number
    const proposalNumber = `PP${Date.now()}`

    const proposalData = {
      title: title || "",
      proposalNumber: proposalNumber, // Add the new proposal number
      client: cleanClient,
      products: cleanProducts,
      totalAmount: totalAmount || 0,
      validUntil: options.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: options.notes || "",
      customMessage: options.customMessage || "",
      createdBy: userId,
      companyId: options.companyId || null, // Add company_id to proposal data
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "draft" as const, // Always set to draft now
      campaignId: options.campaignId || null, // Store campaign ID if provided
    }

    const docRef = await addDoc(collection(db, "proposals"), proposalData)

    // Create campaign from proposal if no campaign ID was provided
    let campaignId = options.campaignId
    if (!campaignId) {
      try {
        const proposalWithId = {
          id: docRef.id,
          ...proposalData,
          createdAt: new Date(),
          updatedAt: new Date(),
          validUntil: proposalData.validUntil,
        }
        campaignId = await createCampaignFromProposal(proposalWithId as any, userId)

        // Update the proposal with the new campaign ID
        await updateDoc(doc(db, "proposals", docRef.id), {
          campaignId: campaignId,
          updatedAt: serverTimestamp(),
        })
      } catch (campaignError) {
        console.error("Error creating campaign:", campaignError)
        // Don't throw - proposal was created successfully
      }
    }

    try {
      await logProposalCreated(docRef.id, title, userId, "Current User")
    } catch (activityError) {
      console.error("Error logging proposal creation:", activityError)
      // Don't throw - proposal was created successfully
    }

    return docRef.id
  } catch (error) {
    console.error("Error creating proposal:", error)
    throw error
  }
}

// Send proposal email
export async function sendProposalEmail(
  proposal: any,
  clientEmail: string,
  subject?: string, // Added subject parameter
  body?: string, // Added body parameter
  currentUserEmail?: string, // New: current user's email for reply-to
  ccEmail?: string, // New: CC email
): Promise<void> {
  try {
    console.log("Sending proposal email to:", clientEmail)

    const response = await fetch("/api/proposals/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proposal,
        clientEmail,
        subject, // Pass subject
        body, // Pass body
        currentUserEmail, // Pass current user's email
        ccEmail, // Pass CC email
      }),
    })

    console.log("Email API response status:", response.status)

    // Check if response is ok
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.details || errorMessage
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.error("Failed to parse error response:", parseError)
      }

      throw new Error(errorMessage)
    }

    // Parse successful response
    let result
    try {
      result = await response.json()
    } catch (parseError) {
      console.error("Failed to parse success response:", parseError)
      throw new Error("Email sent but response was invalid")
    }

    if (!result.success) {
      throw new Error(result.error || result.details || "Email sending failed")
    }

    console.log("Email sent successfully:", result)

    try {
      await logProposalEmailSent(proposal.id, clientEmail, proposal.createdBy || "system", "System")
    } catch (activityError) {
      console.error("Error logging email activity:", activityError)
    }
  } catch (error) {
    console.error("Error sending proposal email:", error)
    throw error
  }
}

// Get proposals by user ID
export async function getProposalsByUserId(userId: string): Promise<Proposal[]> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const proposalsRef = collection(db, "proposals")
    const q = query(proposalsRef, where("createdBy", "==", userId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const proposals: Proposal[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      proposals.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
      } as Proposal)
    })

    return proposals
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return []
  }
}

// Get a single proposal by ID
export async function getProposalById(proposalId: string): Promise<Proposal | null> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    console.log("Getting proposal by ID:", proposalId)
    const proposalDoc = await getDoc(doc(db, "proposals", proposalId))

    if (proposalDoc.exists()) {
      const data = proposalDoc.data()
      console.log("Proposal data found:", data.title)

      // Convert Firestore timestamps to dates
      const proposal: Proposal = {
        id: proposalDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || new Date(),
      } as Proposal

      return proposal
    }

    console.log("Proposal document does not exist")
    return null
  } catch (error) {
    console.error("Error fetching proposal:", error)
    return null
  }
}

// Removed verifyProposalPassword function

// Update proposal status with optional custom user info for public viewers
export async function updateProposalStatus(
  proposalId: string,
  status: Proposal["status"],
  customUserId?: string,
  customUserName?: string,
): Promise<void> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    // Before updating the status, get the current proposal to log the old status
    const currentProposal = await getProposalById(proposalId)
    const oldStatus = currentProposal?.status || "unknown"

    const proposalRef = doc(db, "proposals", proposalId)
    await updateDoc(proposalRef, {
      status,
      updatedAt: serverTimestamp(),
    })

    // Update campaign status and add timeline event
    try {
      const campaign = await getCampaignByProposalId(proposalId)
      if (campaign) {
        let campaignStatus: any
        let timelineTitle = ""
        let timelineDescription = ""

        switch (status) {
          case "sent":
            campaignStatus = "proposal_sent"
            timelineTitle = "Proposal Sent"
            timelineDescription = `Proposal "${currentProposal?.title}" was sent to client`
            break
          case "accepted":
            campaignStatus = "proposal_accepted"
            timelineTitle = "Proposal Accepted"
            timelineDescription = `Proposal "${currentProposal?.title}" was accepted by ${currentProposal?.client?.contactPerson || "client"}`
            break
          case "declined":
            campaignStatus = "proposal_declined"
            timelineTitle = "Proposal Declined"
            timelineDescription = `Proposal "${currentProposal?.title}" was declined by ${currentProposal?.client?.contactPerson || "client"}`
            break
          default:
            campaignStatus = "proposal_draft"
            timelineTitle = "Proposal Updated"
            timelineDescription = `Proposal "${currentProposal?.title}" status changed to ${status}`
        }

        // Update campaign status
        await updateCampaignStatus(campaign.id, campaignStatus, customUserId || "system", customUserName || "System")

        // Add timeline event
        await addCampaignTimelineEvent(
          campaign.id,
          status === "accepted" ? "proposal_accepted" : status === "declined" ? "proposal_declined" : "proposal_sent",
          timelineTitle,
          timelineDescription,
          customUserId || "system",
          customUserName || "System",
        )
      }
    } catch (campaignError) {
      console.error("Error updating campaign status:", campaignError)
      // Don't throw - proposal status was updated successfully
    }

    try {
      // Use custom user info if provided (for public viewers), otherwise use default
      const userId = customUserId || "current_user"
      const userName = customUserName || "Current User"

      // If it's a public viewer accepting, use the client information
      if (customUserId === "public_viewer" && currentProposal) {
        const clientName = `${currentProposal.client.contactPerson} (${currentProposal.client.company})`
        await logProposalStatusChanged(proposalId, oldStatus, status, customUserId, clientName)
      } else {
        await logProposalStatusChanged(proposalId, oldStatus, status, userId, userName)
      }
    } catch (activityError) {
      console.error("Error logging status change:", activityError)
    }
  } catch (error) {
    console.error("Error updating proposal status:", error)
    throw error
  }
}

// Implement the updateProposal function
export async function updateProposal(
  proposalId: string,
  data: Partial<Proposal>,
  userId: string,
  userName: string,
): Promise<void> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    console.log("[v0] Updating proposal with data:", data) // Added debug logging

    const proposalRef = doc(db, "proposals", proposalId)

    // Prepare data for Firestore update, handling nested objects
    const updateData: { [key: string]: any } = {
      updatedAt: serverTimestamp(),
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.customMessage !== undefined) updateData.customMessage = data.customMessage
    if (data.proposalNumber !== undefined) updateData.proposalNumber = data.proposalNumber // Add update for proposalNumber
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount

    if (data.templateSize !== undefined) updateData.templateSize = data.templateSize
    if (data.templateOrientation !== undefined) updateData.templateOrientation = data.templateOrientation
    if (data.templateLayout !== undefined) updateData.templateLayout = data.templateLayout
    if (data.templateBackground !== undefined) updateData.templateBackground = data.templateBackground

    if (data.products !== undefined) {
      updateData.products = data.products
      // Recalculate total amount when products are updated
      const totalAmount = data.products.reduce((sum, product) => {
        const price = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price
        return sum + (isNaN(price) ? 0 : price)
      }, 0)
      updateData.totalAmount = totalAmount
    }

    // Handle client object updates
    if (data.client) {
      if (data.client.company !== undefined) updateData["client.company"] = data.client.company
      if (data.client.contactPerson !== undefined) updateData["client.contactPerson"] = data.client.contactPerson
      if (data.client.email !== undefined) updateData["client.email"] = data.client.email
      if (data.client.phone !== undefined) updateData["client.phone"] = data.client.phone
      if (data.client.address !== undefined) updateData["client.address"] = data.client.address
      if (data.client.industry !== undefined) updateData["client.industry"] = data.client.industry
      if (data.client.targetAudience !== undefined) updateData["client.targetAudience"] = data.client.targetAudience
      if (data.client.campaignObjective !== undefined)
        updateData["client.campaignObjective"] = data.client.campaignObjective
      if (data.client.company_id !== undefined) updateData["client.company_id"] = data.client.company_id // Add client_company_id to updateData
    }

    console.log("[v0] Final update data being sent to Firestore:", updateData) // Added debug logging

    await updateDoc(proposalRef, updateData)

    console.log("[v0] Firestore update completed successfully") // Added debug logging

    // Log the activity
    await logProposalStatusChanged(proposalId, "updated", "updated", userId, userName) // Re-using status change log for general update
    console.log(`Proposal ${proposalId} updated by ${userName}`)
  } catch (error) {
    console.error("[v0] Error updating proposal:", error) // Added debug prefix
    throw error
  }
}

// Generate PDF data for proposal
export function generateProposalPDFData(proposal: Proposal) {
  return {
    title: proposal.title,
    proposalNumber: proposal.proposalNumber, // Include proposal number in PDF data
    client: proposal.client,
    products: proposal.products.map((product) => ({
      name: product.name,
      type: product.type,
      location: product.location,
      price: typeof product.price === "string" ? Number.parseFloat(product.price) : product.price,
      siteCode: product.site_code,
      description: product.description,
      specs: product.specs_rental
        ? {
            trafficCount: product.specs_rental.traffic_count,
            dimensions:
              product.specs_rental.height && product.specs_rental.width
                ? `${product.specs_rental.height}m x ${product.specs_rental.width}m`
                : undefined,
            audienceType: product.specs_rental.audience_type,
          }
        : undefined,
    })),
    totalAmount: proposal.totalAmount,
    validUntil: proposal.validUntil,
    notes: proposal.notes,
    customMessage: proposal.customMessage,
    createdAt: proposal.createdAt,
  }
}

export async function getProposal(id: string) {
  // Implementation for getting a proposal
  console.log("Getting proposal:", id)
  return await getProposalById(id)
}

// Removed the old placeholder updateProposal
// export async function updateProposal(id: string, data: any, userId: string, userName: string) {
//   // Implementation for updating a proposal
//   console.log("Updating proposal:", id, data, userId, userName)
//   return { id: id, ...data }
// }

export async function deleteProposal(id: string, userId: string, userName: string) {
  // Implementation for deleting a proposal
  console.log("Deleting proposal:", id, userId, userName)
  return { id: id }
}

export async function getPaginatedProposals(
  itemsPerPage: number,
  lastDoc: any | null,
  searchTerm = "",
  statusFilter: string | null = null,
): Promise<{ items: Proposal[]; lastDoc: any | null; hasMore: boolean }> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    let q = query(collection(db, "proposals"), orderBy("createdAt", "desc"))

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      // This is a basic search. For more advanced full-text search, consider Algolia or a similar service.
      // Firestore doesn't support full-text search directly or OR queries across multiple fields easily.
      // For now, we'll filter after fetching, which might be inefficient for large datasets.
      // A more robust solution would involve a dedicated search index.
    }

    if (statusFilter && statusFilter !== "all") {
      q = query(q, where("status", "==", statusFilter))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    q = query(q, limit(itemsPerPage + 1)) // Fetch one more to check if there are more items

    const querySnapshot = await getDocs(q)
    const proposals: Proposal[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      proposals.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
      } as Proposal)
    })

    let filteredItems = proposals
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filteredItems = proposals.filter(
        (proposal) =>
          (statusFilter === "all" || !statusFilter || proposal.status === statusFilter) &&
          (proposal.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            proposal.client.company.toLowerCase().includes(lowerCaseSearchTerm) ||
            (proposal.proposalNumber && proposal.proposalNumber.toLowerCase().includes(lowerCaseSearchTerm))), // Include proposalNumber in search
      )
    }

    const hasMore = filteredItems.length > itemsPerPage
    const itemsToReturn = filteredItems.slice(0, itemsPerPage)
    const newLastDoc = querySnapshot.docs[itemsToReturn.length] || null

    return { items: itemsToReturn, lastDoc: newLastDoc, hasMore }
  } catch (error) {
    console.error("Error fetching paginated proposals:", error)
    return { items: [], lastDoc: null, hasMore: false }
  }
}

export async function getPaginatedProposalsByUserId(
  userId: string,
  itemsPerPage: number,
  lastDoc: any | null,
  searchTerm = "",
  statusFilter: string | null = null,
): Promise<{ items: Proposal[]; lastDoc: any | null; hasMore: boolean }> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    let q = query(collection(db, "proposals"), where("companyId", "==", userId), orderBy("createdAt", "desc"))

    if (statusFilter && statusFilter !== "all") {
      q = query(q, where("status", "==", statusFilter))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    q = query(q, limit(itemsPerPage + 1)) // Fetch one more to check if there are more items

    const querySnapshot = await getDocs(q)
    const proposals: Proposal[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      proposals.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
      } as Proposal)
    })

    let filteredItems = proposals
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filteredItems = proposals.filter(
        (proposal) =>
          proposal.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          proposal.client.company.toLowerCase().includes(lowerCaseSearchTerm) ||
          (proposal.proposalNumber && proposal.proposalNumber.toLowerCase().includes(lowerCaseSearchTerm)),
      )
    }

    const hasMore = filteredItems.length > itemsPerPage
    const itemsToReturn = filteredItems.slice(0, itemsPerPage)
    const newLastDoc = querySnapshot.docs[itemsToReturn.length] || null

    return { items: itemsToReturn, lastDoc: newLastDoc, hasMore }
  } catch (error) {
    console.error("Error fetching paginated proposals by user:", error)
    return { items: [], lastDoc: null, hasMore: false }
  }
}

export async function getProposalsCountByUserId(
  userId: string,
  searchTerm = "",
  statusFilter: string | null = null,
): Promise<number> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    let q = query(collection(db, "proposals"), where("createdBy", "==", userId))

    if (statusFilter && statusFilter !== "all") {
      q = query(q, where("status", "==", statusFilter))
    }

    // If there's a search term, we need to fetch all and filter client-side
    if (searchTerm) {
      const allProposalsSnapshot = await getDocs(q)
      const allProposals: Proposal[] = []
      allProposalsSnapshot.forEach((doc) => {
        const data = doc.data()
        allProposals.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
        } as Proposal)
      })

      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      const filteredProposals = allProposals.filter(
        (proposal) =>
          proposal.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          proposal.client.company.toLowerCase().includes(lowerCaseSearchTerm) ||
          (proposal.proposalNumber && proposal.proposalNumber.toLowerCase().includes(lowerCaseSearchTerm)),
      )
      return filteredProposals.length
    }

    const snapshot = await getCountFromServer(q)
    return snapshot.data().count
  } catch (error) {
    console.error("Error getting proposals count by user:", error)
    return 0
  }
}

export async function getProposalsCount(searchTerm = "", statusFilter: string | null = null): Promise<number> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const q = collection(db, "proposals")
    let countQuery = query(q)

    if (statusFilter && statusFilter !== "all") {
      countQuery = query(countQuery, where("status", "==", statusFilter))
    }

    const snapshot = await getCountFromServer(countQuery)
    let count = snapshot.data().count

    // If there's a search term, we need to fetch all (or a large subset) and filter client-side
    // as Firestore count queries don't support complex string matching.
    if (searchTerm) {
      const allProposalsQuery = query(collection(db, "proposals"), orderBy("createdAt", "desc"))
      const allProposalsSnapshot = await getDocs(allProposalsQuery)
      const allProposals: Proposal[] = []
      allProposalsSnapshot.forEach((doc) => {
        const data = doc.data()
        allProposals.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
        } as Proposal)
      })

      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      const filteredProposals = allProposals.filter(
        (proposal) =>
          (statusFilter === "all" || !statusFilter || proposal.status === statusFilter) &&
          (proposal.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            proposal.client.company.toLowerCase().includes(lowerCaseSearchTerm) ||
            (proposal.proposalNumber && proposal.proposalNumber.toLowerCase().includes(lowerCaseSearchTerm))), // Include proposalNumber in count search
      )
      count = filteredProposals.length
    }

    return count
  } catch (error) {
    console.error("Error getting proposals count:", error)
    return 0
  }
}

// Client-side PDF generation using html2canvas
export async function downloadProposalPDF(
  proposal: Proposal,
  selectedSize: string,
  selectedOrientation: string,
  toast: (options: any) => void
): Promise<void> {
  try {
    // Dynamic imports for client-side libraries
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default

    toast({
      title: "Download",
      description: "Generating PDF...",
    })

    // Find all page containers
    const pageContainers = document.querySelectorAll('[class*="mx-auto bg-white shadow-lg"]')

    if (pageContainers.length === 0) {
      throw new Error("No proposal pages found")
    }

    const pdf = new jsPDF({
      orientation: selectedOrientation === "Landscape" ? "landscape" : "portrait",
      unit: "mm",
      format: selectedSize === "A4" ? "a4" : selectedSize === "Letter size" ? "letter" : "legal"
    })

    for (let i = 0; i < pageContainers.length; i++) {
      const container = pageContainers[i] as HTMLElement

      // Capture the page with html2canvas
      const canvas = await html2canvas(container, {
        scale: 3, // Higher quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: container.offsetWidth,
        height: container.offsetHeight,
        imageTimeout: 0,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')

      // Calculate dimensions to fit the page
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = (pdfHeight - imgHeight * ratio) / 2

      if (i > 0) {
        pdf.addPage()
      }

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
    }

    // Save the PDF
    pdf.save(`OH_PROP_${proposal.id}_${proposal.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`)

    toast({
      title: "Success",
      description: "PDF downloaded successfully",
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    toast({
      title: "Error",
      description: "Failed to generate PDF. Please try again.",
      variant: "destructive",
    })
  }
}
