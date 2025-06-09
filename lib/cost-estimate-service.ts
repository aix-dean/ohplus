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
import type { CostEstimate, CostEstimateLineItem } from "@/lib/types/cost-estimate"
import type { Proposal } from "@/lib/types/proposal"

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
  options: {
    notes?: string
    customLineItems?: CostEstimateLineItem[]
    sendEmail?: boolean
  } = {},
): Promise<string> {
  try {
    // Generate default line items based on proposal products
    const defaultLineItems: CostEstimateLineItem[] = proposal.products.map((product, index) => ({
      id: `item_${index + 1}`,
      description: `${product.name} - ${product.location}`,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
      category: "media_cost" as const,
    }))

    // Add standard cost categories
    const additionalItems: CostEstimateLineItem[] = [
      {
        id: `item_${defaultLineItems.length + 1}`,
        description: "Creative Design & Production",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        category: "production_cost" as const,
      },
      {
        id: `item_${defaultLineItems.length + 2}`,
        description: "Installation & Setup",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        category: "installation_cost" as const,
      },
      {
        id: `item_${defaultLineItems.length + 3}`,
        description: "Maintenance & Monitoring",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        category: "maintenance_cost" as const,
      },
    ]

    const allLineItems = [...defaultLineItems, ...additionalItems, ...(options.customLineItems || [])]

    const subtotal = allLineItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxRate = 0.12 // 12% VAT
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount

    const costEstimatePassword = generateCostEstimatePassword()

    const costEstimateData = {
      proposalId: proposal.id,
      title: `Cost Estimate for ${proposal.title}`,
      lineItems: allLineItems,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes: options.notes || "",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: options.sendEmail ? "sent" : ("draft" as const),
      password: costEstimatePassword,
    }

    const docRef = await addDoc(collection(db, "costEstimates"), costEstimateData)

    // Send email if requested
    if (options.sendEmail && proposal.client.email) {
      try {
        const costEstimateWithId = {
          id: docRef.id,
          ...costEstimateData,
          createdAt: new Date(),
          updatedAt: new Date(),
          password: costEstimatePassword,
        }

        await sendCostEstimateEmail(costEstimateWithId, proposal.client.email, proposal.client)
      } catch (emailError) {
        console.error("Error sending cost estimate email:", emailError)
      }
    }

    return docRef.id
  } catch (error) {
    console.error("Error creating cost estimate:", error)
    throw error
  }
}

// Send cost estimate email
export async function sendCostEstimateEmail(costEstimate: any, clientEmail: string, client: any): Promise<void> {
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
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const costEstimatesRef = collection(db, "costEstimates")
    const q = query(costEstimatesRef, where("proposalId", "==", proposalId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const costEstimates: CostEstimate[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      costEstimates.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        approvedAt:
          data.approvedAt instanceof Timestamp
            ? data.approvedAt.toDate()
            : data.approvedAt
              ? new Date(data.approvedAt)
              : undefined,
        rejectedAt:
          data.rejectedAt instanceof Timestamp
            ? data.rejectedAt.toDate()
            : data.rejectedAt
              ? new Date(data.rejectedAt)
              : undefined,
      } as CostEstimate)
    })

    return costEstimates
  } catch (error) {
    console.error("Error fetching cost estimates:", error)
    return []
  }
}

// Get a single cost estimate by ID
export async function getCostEstimateById(costEstimateId: string): Promise<CostEstimate | null> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const costEstimateDoc = await getDoc(doc(db, "costEstimates", costEstimateId))

    if (costEstimateDoc.exists()) {
      const data = costEstimateDoc.data()

      const costEstimate: CostEstimate = {
        id: costEstimateDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        approvedAt: data.approvedAt?.toDate() || undefined,
        rejectedAt: data.rejectedAt?.toDate() || undefined,
      } as CostEstimate

      return costEstimate
    }

    return null
  } catch (error) {
    console.error("Error fetching cost estimate:", error)
    return null
  }
}

// Update cost estimate status
export async function updateCostEstimateStatus(
  costEstimateId: string,
  status: CostEstimate["status"],
  userId?: string,
  rejectionReason?: string,
): Promise<void> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    }

    if (status === "approved") {
      updateData.approvedBy = userId
      updateData.approvedAt = serverTimestamp()
    } else if (status === "rejected") {
      updateData.rejectedBy = userId
      updateData.rejectedAt = serverTimestamp()
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason
      }
    }

    const costEstimateRef = doc(db, "costEstimates", costEstimateId)
    await updateDoc(costEstimateRef, updateData)
  } catch (error) {
    console.error("Error updating cost estimate status:", error)
    throw error
  }
}

// Update cost estimate
export async function updateCostEstimate(costEstimateId: string, updates: Partial<CostEstimate>): Promise<void> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const costEstimateRef = doc(db, "costEstimates", costEstimateId)
    await updateDoc(costEstimateRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating cost estimate:", error)
    throw error
  }
}
