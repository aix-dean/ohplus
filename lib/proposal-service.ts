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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Proposal, ProposalProduct, ProposalClient } from "@/lib/types/proposal"
import { logProposalCreated, logProposalStatusChanged, logProposalEmailSent } from "@/lib/proposal-activity-service"

// Generate a secure password for proposal access
function generateProposalPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

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
    sendEmail?: boolean
    campaignId?: string // Add optional campaign ID parameter
  } = {},
): Promise<string> {
  try {
    const totalAmount = products.reduce((sum, product) => {
      const price = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price
      return sum + (isNaN(price) ? 0 : price)
    }, 0)

    // Clean the client data to ensure no undefined values
    const cleanClient: ProposalClient = {
      company: client.company || "",
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      industry: client.industry || "",
      targetAudience: client.targetAudience || "",
      campaignObjective: client.campaignObjective || "",
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

    // Generate a secure password for the proposal
    const proposalPassword = generateProposalPassword()

    const proposalData = {
      title: title || "",
      client: cleanClient,
      products: cleanProducts,
      totalAmount: totalAmount || 0,
      validUntil: options.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: options.notes || "",
      customMessage: options.customMessage || "",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: options.sendEmail ? "sent" : ("draft" as const),
      password: proposalPassword, // Store the generated password
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

    // Send email if requested
    if (options.sendEmail && cleanClient.email) {
      try {
        const proposalWithId = {
          id: docRef.id,
          ...proposalData,
          createdAt: new Date(),
          updatedAt: new Date(),
          validUntil: proposalData.validUntil,
          password: proposalPassword, // Include password in email data
          campaignId: campaignId, // Include campaign ID
        }

        await sendProposalEmail(proposalWithId, cleanClient.email)

        // Update campaign status to sent and add timeline event
        try {
          if (campaignId) {
            await updateCampaignStatus(campaignId, "proposal_sent", userId, "Current User")
            await addCampaignTimelineEvent(
              campaignId,
              "proposal_sent",
              "Proposal Sent",
              `Proposal "${title}" was sent to ${cleanClient.email}`,
              userId,
              "Current User",
            )
          }
        } catch (campaignError) {
          console.error("Error updating campaign for sent proposal:", campaignError)
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError)
        // Don't throw error here - proposal was created successfully
      }
    }

    return docRef.id
  } catch (error) {
    console.error("Error creating proposal:", error)
    throw error
  }
}

// Send proposal email
export async function sendProposalEmail(proposal: any, clientEmail: string): Promise<void> {
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

// Verify proposal password
export async function verifyProposalPassword(proposalId: string, password: string): Promise<boolean> {
  try {
    const proposal = await getProposalById(proposalId)
    if (!proposal) {
      return false
    }

    return proposal.password === password
  } catch (error) {
    console.error("Error verifying proposal password:", error)
    return false
  }
}

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

// Generate PDF data for proposal
export function generateProposalPDFData(proposal: Proposal) {
  return {
    title: proposal.title,
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
  return { id: id, title: "Fake Proposal", description: "This is a fake proposal." }
}

export async function updateProposal(id: string, data: any, userId: string, userName: string) {
  // Implementation for updating a proposal
  console.log("Updating proposal:", id, data, userId, userName)
  return { id: id, ...data }
}

export async function deleteProposal(id: string, userId: string, userName: string) {
  // Implementation for deleting a proposal
  console.log("Deleting proposal:", id, userId, userName)
  return { id: id }
}

export async function getProposals() {
  // Implementation for getting all proposals
  console.log("Getting all proposals")
  return [
    { id: "fake-proposal-id-1", title: "Fake Proposal 1" },
    { id: "fake-proposal-id-2", title: "Fake Proposal 2" },
  ]
}
