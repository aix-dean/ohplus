import type { Timestamp } from "firebase/firestore"

export type JobOrderType = "Installation" | "Maintenance" | "Repair" | "Dismantling" | "Other"
export type JobOrderStatus = "draft" | "pending" | "approved" | "rejected" | "completed" | "cancelled"

export interface JobOrder {
  id: string
  quotationId: string
  joNumber: string // Auto-generated or manually assigned
  dateRequested: string // ISO string
  joType: JobOrderType
  deadline: string // ISO string
  requestedBy: string // User's name or ID
  remarks: string
  assignTo: string // User ID of assignee
  attachments: string[] // Array of attachment URLs

  // Fields copied from Quotation/Product/Client for snapshot
  quotationNumber: string
  clientName: string
  clientCompany: string
  contractDuration: string // e.g., "6 months"
  contractPeriodStart: string // ISO string
  contractPeriodEnd: string // ISO string
  siteName: string
  siteCode: string
  siteType: string
  siteSize: string
  siteIllumination: string
  leaseRatePerMonth: number
  totalMonths: number
  totalLease: number
  vatAmount: number
  totalAmount: number
  siteImageUrl: string
  missingCompliance: {
    signedQuotation: boolean
    poMo: boolean
    projectFa: boolean
  }

  // Audit fields
  createdBy: string // User ID of the creator
  status: JobOrderStatus
  createdAt: Timestamp // Firestore Timestamp
  updatedAt: Timestamp // Firestore Timestamp
}
