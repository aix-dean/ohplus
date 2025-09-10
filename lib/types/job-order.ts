import type { Timestamp } from "firebase/firestore"

export type JobOrderType = "Installation" | "Maintenance" | "Repair" | "Dismantling" | "Other"
export type JobOrderStatus = "draft" | "pending" | "approved" | "rejected" | "completed" | "cancelled"

export interface JobOrder {
  id: string
  joNumber: string
  siteName: string
  siteLocation?: string
  joType: JobOrderType | string
  requestedBy: string
  assignTo: string
  dateRequested: string | Date
  deadline: string | Date
  jobDescription?: string
  message?: string
  attachments: { url: string; name: string; type: string }[] // Changed to array of objects
  materialSpecs?: string // Added materialSpecs
  attachments: string[]
  status: JobOrderStatus | string
  created?: Date | Timestamp
  updated?: Date | Timestamp
  created_by: string
  company_id: string
  quotation_id?: string

  // Additional fields from the actual database structure
  clientCompany?: string
  clientName?: string
  contractDuration?: string
  contractPeriodEnd?: string | Date
  contractPeriodStart?: string | Date
  leaseRatePerMonth?: number
  missingCompliance?: Record<string, any>
  poMo?: boolean
  projectFa?: boolean
  signedQuotation?: boolean
  poMoUrl?: string | null
  product_id?: string
  projectFaUrl?: string | null
  quotationNumber?: string
  remarks?: string
  signedQuotationUrl?: string | null
  siteCode?: string
  siteIllumination?: string
  siteImageUrl?: string
  siteSize?: string
  siteType?: string
  totalAmount?: number
  totalLease?: number
  totalMonths?: number
  vatAmount?: number
}
