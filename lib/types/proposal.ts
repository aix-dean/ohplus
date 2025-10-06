export type ProposalClient = {
  id: string // Added missing id field
  company: string
  contactPerson: string
  name: string
  email: string
  phone: string
  address?: string
  industry?: string
  targetAudience?: string
  campaignObjective?: string
  designation?: string // Added new field
  companyLogoUrl?: string // Added new field
  company_id?: string // Added new field
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
  distance?: string // Added missing field
  type?: string     // Added missing field
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
  // Add all other fields from Product interface that might be needed
  active?: boolean
  deleted?: boolean
  created?: any
  updated?: any
  seller_id?: string
  seller_name?: string
  company_id?: string | null
  position?: number
  categories?: string[]
  category_names?: string[]
  content_type?: string
  cms?: {
    start_time?: string
    end_time?: string
    spot_duration?: number
    loops_per_day?: number
    spots_per_loop?: number
  } | null
  status?: string
  address?: string
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
   companyName?: string // Add company name field
   companyLogo?: string // Add company logo field
   campaignId?: string | null
   templateSize?: string
   templateOrientation?: string
   templateLayout?: string
   templateBackground?: string
   pdf?: string // PDF URL field
   password?: string // 8-digit password field
   status:
     | "draft"
     | "sent"
     | "viewed"
     | "accepted"
     | "declined"
     | "cost_estimate_pending"
     | "cost_estimate_approved"
     | "cost_estimate_rejected"
   password?: string // Optional password for public access
   createdAt: Date
   updatedAt: Date
 }
