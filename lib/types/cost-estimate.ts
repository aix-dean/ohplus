import type { ProposalClient } from "./proposal"
import type { SpecsRental } from "./quotation"

export type CostEstimateStatus = "draft" | "sent" | "viewed" | "accepted" | "declined" | "revised"

export type CostEstimateClient = ProposalClient

export interface CostEstimateLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  category: string // e.g., "Billboard Rental", "Production", "Installation", "Maintenance"
  notes?: string
  image?: string // Added optional image field for product images
  specs?: SpecsRental // Added specs field to match quotation structure
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
  company_id?: string // Company ID from user data
  page_id?: string // Page ID for grouping multiple cost estimates
  page_number?: number // Page number for multiple products (1, 2, 3, etc.)
  startDate?: Date | null // New field
  endDate?: Date | null // New field
  durationDays?: number | null // New field for duration in days
  validUntil?: Date | null // Add this new field
}
