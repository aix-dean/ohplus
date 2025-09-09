export interface MediaItem {
  distance?: string
  isVideo?: boolean
  type?: string // e.g., "Video", "Image"
  url?: string
  name?: string
  price?: number // This price seems to be for the media item itself, not the product.
}

export interface SpecsRental {
  audience_type?: string
  audience_types?: string[] // e.g., ["General Public"]
  elevation?: number
  height?: number
  location?: string // e.g., "manila"
  traffic_count?: number
  width?: number
  type?: string // e.g., "RENTAL"
}

export interface QuotationProduct {
  product_id: string
  name: string
  location: string
  price: number // Monthly price
  site_code?: string
  type?: string // e.g., "LED Billboard", "Static Billboard"
  description?: string // Added for product description
  health_percentage?: number // Added from image
  light?: boolean // Added from image
  media?: MediaItem[] // Added from image
  specs_rental?: SpecsRental // Added from image
  // New fields from image data model
  media_url?: string // Added to match image exactly
  duration_days?: number // Duration specific to this item (if different from overall)
  item_total_amount?: number // Total amount for this specific item
}

export interface ProjectComplianceItem {
  status: "pending" | "completed" | "uploaded"
  pdf_url?: string
  uploaded_date?: any // Firebase Timestamp
  uploaded_by?: string
  file_name?: string
  notes?: string
}

export interface ProjectCompliance {
  signed_quotation: ProjectComplianceItem
  signed_contract: ProjectComplianceItem
  po_mo: ProjectComplianceItem // Purchase Order/Marketing Order
  final_artwork: ProjectComplianceItem
  payment_as_deposit: ProjectComplianceItem
}

export interface Quotation {
  id?: string
  quotation_number: string
  quotation_request_id?: string
  start_date: string
  end_date: string
  total_amount: number
  duration_days: number // Overall duration for the quotation
  notes?: string
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "viewed"
  created: any // Firebase Timestamp
  updated?: any // Firebase Timestamp
  created_by?: string
  created_by_first_name?: string
  created_by_last_name?: string
  client_name?: string
  client_email?: string
  client_id?: string
  client_designation?: string // Added client designation
  client_address?: string // Added client address
  client_phone?: string // Added client phone
  campaignId?: string
  proposalId?: string
  valid_until?: any // Firebase Timestamp
  seller_id?: string
  product_id?: string // Added to support legacy single product quotations
  items: QuotationProduct[] // Renamed from 'products' to 'items'
  project_compliance?: ProjectCompliance
}
