export type ProposalClient = {
  company: string
  contactPerson: string
  email: string
  phone: string
  address?: string
  industry?: string
  targetAudience?: string
  campaignObjective?: string
  designation?: string // Added new field
  companyLogoUrl?: string // Added new field
}

export type ProductSpecsRental = {
  location?: string
  traffic_count?: number
  elevation?: number
  height?: number
  width?: number
  audience_type?: string
  audience_types?: string[]
}

export type ProductLight = {
  location?: string
  name?: string
  operator?: string
}

export type ProductMedia = {
  url: string
  isVideo: boolean
}

export type ProposalProduct = {
  id: string
  name: string
  type: string
  price: number
  location: string
  site_code?: string
  media?: ProductMedia[]
  specs_rental?: ProductSpecsRental | null
  light?: ProductLight | null
  description?: string
  health_percentage?: number
}

export type Proposal = {
  id: string
  title: string
  description?: string
  proposalNumber?: string // Add proposal number field
  client: ProposalClient
  products: ProposalProduct[]
  totalAmount: number
  validUntil: Date
  notes?: string
  customMessage?: string
  createdBy: string
  companyId?: string | null // Add company_id field
  campaignId?: string | null
  templateSize?: string
  templateOrientation?: string
  templateLayout?: string
  templateBackground?: string
  status:
    | "draft"
    | "sent"
    | "viewed"
    | "accepted"
    | "declined"
    | "cost_estimate_pending"
    | "cost_estimate_approved"
    | "cost_estimate_rejected"
  createdAt: Date
  updatedAt: Date
}
