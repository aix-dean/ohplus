import type { ProposalClient } from "./proposal"

export type CostEstimateStatus = "draft" | "sent" | "accepted" | "declined" | "revised"

export type CostEstimateClient = ProposalClient

export interface CostEstimateLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  category: string // e.g., "Billboard Rental", "Production", "Installation", "Maintenance"
  notes?: string
}

export interface CostEstimate {
  id: string
  proposalId: string | null // Nullable if it's a direct cost estimate
  costEstimateNumber: string // New field for CE + currentmillis
  title: string
  client: ProposalClient // Reusing ProposalClient type for consistency
  lineItems: CostEstimateLineItem[]
  totalAmount: number
  status: CostEstimateStatus
  notes?: string
  customMessage?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string // User ID of who created it
  startDate?: Date | null // New field
  endDate?: Date | null // New field
  durationDays?: number | null // New field for duration in days
  validUntil?: Date | null // Add this new field
}
